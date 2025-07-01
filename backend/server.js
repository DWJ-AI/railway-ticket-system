const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const cors = require('cors');
const mysqldump = require('mysqldump');
const archiver = require('archiver');  
const bcrypt = require('bcryptjs');  // 用于加密密码
const app = express();
const PORT = 3000;
const winston = require('winston');
const fs = require('fs');
const readline = require('readline');
const path = require('path');

// 解析 JSON 请求体
app.use(cors());
app.use(bodyParser.json());

// 配置日志记录器
const logger = winston.createLogger({
    level: 'info',
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'app.log' }) // 日志记录到 app.log 文件
    ]
});

// 假设日志文件路径为 'app.log'
const logFilePath = 'app.log';

// 创建数据库连接
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // 替换为您的 MySQL 用户名
    password: 'x2232313', // 替换为您的 MySQL 密码
    database: 'ticketing_system' // 替换为您的数据库名
});

// 连接到 MySQL 数据库
db.connect(err => {
    if (err) {
        console.error('数据库连接失败: ' + err.stack);
        return;
    }
    console.log('连接到数据库成功');
});

// 设置路由来处理备份请求
app.get('/api/backup', (req, res) => {
    const backupFolder = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupFolder)) {
        fs.mkdirSync(backupFolder);
    }

    const timestamp = new Date().toISOString().replace(/[:.-]/g, '_');
    const backupFileName = `backup_${timestamp}.sql`;
    const zipFileName = `backup_${timestamp}.zip`;

    // 1. 进行数据库备份
    mysqldump({
        connection: {
            host: 'localhost',
            user: 'root', // 替换为您的 MySQL 用户名
            password: 'x2232313', // 替换为您的 MySQL 密码
            database: 'ticketing_system' // 替换为您的数据库名
        },
        dumpToFile: path.join(backupFolder, backupFileName)
    }).then(() => {
        // 2. 创建压缩文件并将SQL备份文件添加进去
        const output = fs.createWriteStream(path.join(backupFolder, zipFileName));
        const archive = archiver('zip', {
            zlib: { level: 9 } // 压缩等级
        });

        output.on('close', () => {
            console.log(`Backup zip file has been created: ${zipFileName}`);
            res.download(path.join(backupFolder, zipFileName), zipFileName); // 返回下载链接
        });

        archive.on('error', (err) => {
            throw err;
        });

        archive.pipe(output);
        archive.append(fs.createReadStream(path.join(backupFolder, backupFileName)), { name: backupFileName });
        archive.finalize();
    }).catch(err => {
        res.status(500).send({ message: `备份失败：${err.message}` });
        console.error('备份失败：', err);
    });
});


// 注册接口
app.post('/register', (req, res) => {
    const { username, password } = req.body;

    // 检查用户名是否已存在
    db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
        if (err) {
            return res.status(500).json({ error: '数据库查询失败' });
        }
        if (results.length > 0) {
            return res.status(400).json({ error: '用户名已存在' });
        }

        // 使用 bcrypt 加密密码
        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) {
                return res.status(500).json({ error: '密码加密失败' });
            }

            // 插入新用户（加密后的密码）
            db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (err, results) => {
                if (err) {
                    return res.status(500).json({ error: '注册失败' });
                }
                
                // 获取新插入用户的 id
                const newUserId = results.insertId;
                res.status(201).json({ message: '注册成功', userId: newUserId });
            });
        });
    });
});

// 用户登录接口
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    // 查询数据库中是否存在该用户名
    db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
        if (err) {
            return res.status(500).json({ error: '数据库查询失败' });
        }

        // 如果用户名不存在
        if (results.length === 0) {
            return res.status(400).json({ error: '用户不存在' });
        }

        // 获取数据库中存储的加密密码
        const storedPassword = results[0].password;

        // 使用 bcrypt 比较密码
        bcrypt.compare(password, storedPassword, (err, isMatch) => {
            if (err) {
                return res.status(500).json({ error: '密码验证失败' });
            }

            // 如果密码匹配
            if (isMatch) {
                // 记录登录成功的日志，包括 user_id 和用户名
                const userId = results[0].id;
                logger.info(`用户登录成功: 用户ID=${userId}, 用户名=${username}, 登录时间=${new Date().toISOString()}`);
                
                // 返回成功信息，可以返回用户的 id 或 JWT token
                res.status(200).json({ message: '登录成功', userId: userId });
            } else {
                // 如果密码不匹配
                res.status(400).json({ error: '用户名或密码错误' });
            }
        });
    });
});

// 管理员登录接口
app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    // 查询数据库中是否存在该管理员用户名
    db.query('SELECT * FROM admins WHERE username = ?', [username], (err, results) => {
        if (err) {
            return res.status(500).json({ error: '数据库查询失败' });
        }

        // 如果管理员用户名不存在
        if (results.length === 0) {
            return res.status(400).json({ error: '管理员不存在' });
        }

        // 获取数据库中存储的密码（明文）
        const storedPassword = results[0].password;

        // 直接比较输入的密码和存储的密码
        if (password === storedPassword) {
            res.status(200).json({ message: '登录成功', adminId: results[0].id });
            //logger.info(`管理员登录成功: 管理员ID=${userId}, 管理员用户名=${username}, 登录时间=${new Date().toISOString()}`);
        } else {
            // 如果密码不匹配
            res.status(400).json({ error: '密码错误' });
        }
    });
});

// 获取所有车次接口
app.get('/trains1', (req, res) => {
    db.query('SELECT * FROM tickets', (err, results) => {
        if (err) {
            return res.status(500).json({ error: '数据库查询失败' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: '没有找到车次' });
        }
        res.status(200).json(results);
    });
});

// 按车次号查询车次接口
app.get('/trains/number/:number', (req, res) => {
    const { number } = req.params;
    db.query('SELECT * FROM tickets WHERE train_number = ?', [number], (err, results) => {
        if (err) {
            return res.status(500).json({ error: '数据库查询失败' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: '车次不存在' });
        }
        res.status(200).json(results);
    });
});

// 按时间段查询车次接口
app.get('/trains/time', (req, res) => {
    const { startTime, endTime } = req.query;

    if (!startTime || !endTime) {
        return res.status(400).json({ error: '必须提供开始时间和结束时间' });
    }

    // 查询时间段内的车次
    db.query('SELECT * FROM tickets WHERE departure_time BETWEEN ? AND ?', [startTime, endTime], (err, results) => {
        if (err) {
            return res.status(500).json({ error: '数据库查询失败' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: '没有符合条件的车次' });
        }
        res.status(200).json(results);
    });
});

// 删除车次
app.delete('/trains/number/:number', (req, res) => {
    const { number } = req.params;

    const query = 'DELETE FROM tickets WHERE train_number = ?';
    
    db.query(query, [number], (err, result) => {
        if (err) {
            return res.status(500).json({ error: '删除车次数据失败' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: '车次不存在' });
        }
        res.status(200).json({ message: '车次删除成功' });
    });
});
// 更新车次
app.put('/trains/number/:number', (req, res) => {
    const { number } = req.params;
    const {
        departure_location,
        destination_location,
        departure_time,
        arrival_time,
        first_class_price,
        first_class_availability,
        second_class_price,
        second_class_availability,
        sleeper_class_price,
        sleeper_class_availability,
        first_sleeper_class_price,
        first_sleeper_class_availability
    } = req.body;

    // 校验输入数据
    if (
        isNaN(first_class_price) || first_class_price <= 0 ||
        isNaN(first_class_availability) || first_class_availability < 0 ||
        isNaN(second_class_price) || second_class_price <= 0 ||
        isNaN(second_class_availability) || second_class_availability < 0 ||
        isNaN(sleeper_class_price) || sleeper_class_price <= 0 ||
        isNaN(sleeper_class_availability) || sleeper_class_availability < 0 ||
        isNaN(first_sleeper_class_price) || first_sleeper_class_price <= 0 ||
        isNaN(first_sleeper_class_availability) || first_sleeper_class_availability < 0
    ) {
        return res.status(400).json({ error: '无效的输入数据' });
    }

    const query = `
        UPDATE tickets SET departure_location = ?, destination_location = ?, departure_time = ?, arrival_time = ?,
        first_class_price = ?, first_class_availability = ?, second_class_price = ?, second_class_availability = ?,
        sleeper_class_price = ?, sleeper_class_availability = ?, first_sleeper_class_price = ?, first_sleeper_class_availability = ?
        WHERE train_number = ?
    `;

    const values = [
        departure_location, destination_location, departure_time, arrival_time,
        first_class_price, first_class_availability, second_class_price, second_class_availability,
        sleeper_class_price, sleeper_class_availability, first_sleeper_class_price, first_sleeper_class_availability,
        number
    ];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('数据库错误:', err);
            return res.status(500).json({ error: '更新车次数据失败' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: '车次不存在' });
        }
        res.status(200).json({ message: '车次更新成功' });
    });
});

// 增加车次
app.post('/trains', (req, res) => {
    const {
        train_number,
        departure_location,
        destination_location,
        departure_time,
        arrival_time,
        first_class_price,
        first_class_availability,
        second_class_price,
        second_class_availability,
        sleeper_class_price,
        sleeper_class_availability,
        first_sleeper_class_price,
        first_sleeper_class_availability
    } = req.body;

    const query = `
        INSERT INTO tickets (train_number, departure_location, destination_location, departure_time, arrival_time,
            first_class_price, first_class_availability, second_class_price, second_class_availability,
            sleeper_class_price, sleeper_class_availability, first_sleeper_class_price, first_sleeper_class_availability)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
        train_number, departure_location, destination_location, departure_time, arrival_time,
        first_class_price, first_class_availability, second_class_price, second_class_availability,
        sleeper_class_price, sleeper_class_availability, first_sleeper_class_price, first_sleeper_class_availability
    ];

    db.query(query, values, (err, result) => {
        if (err) {
            return res.status(500).json({ error: '插入车次数据失败' });
        }
        res.status(201).json({ message: '车次增加成功' });
    });
});

// 按条件查询车次接口
app.get('/trains/search', (req, res) => {
    const { departure, destination, earliestDeparture, latestDeparture } = req.query;

    // 构建查询条件
    let query = 'SELECT * FROM tickets WHERE 1=1';
    const queryParams = [];

    // 根据前端传来的条件构建 WHERE 子句
    if (departure) {
        query += ' AND departure_location = ?';
        queryParams.push(departure);
    }
    if (destination) {
        query += ' AND destination_location = ?';
        queryParams.push(destination);
    }
    if (earliestDeparture) {
        query += ' AND departure_time >= ?';
        queryParams.push(earliestDeparture);
    }
    if (latestDeparture) {
        query += ' AND departure_time <= ?';
        queryParams.push(latestDeparture);
    }

    // 执行查询
    db.query(query, queryParams, (err, results) => {
        if (err) {
            return res.status(500).json({ error: '数据库查询失败' });
        }

        // 如果没有查询到任何车次
        if (results.length === 0) {
            return res.status(404).json({ message: '没有找到符合条件的车次' });
        }

        // 返回查询结果
        res.status(200).json(results);
    });
});
//检查余量的映射
function getSeatAvailabilityColumn(seatType) {
    switch (seatType) {
        case 'first_class': return 'first_class_availability';
        case 'second_class': return 'second_class_availability';
        case 'sleeper_class': return 'sleeper_class_availability';
        case 'first_sleeper_class': return 'first_sleeper_class_availability';
        default: throw new Error('Invalid seat type');
    }
}
//检查余量函数
function getSeatAvailability(trainNumber, seatType) {
    return new Promise((resolve, reject) => {
        const availabilityColumn = getSeatAvailabilityColumn(seatType);

        const query = `SELECT id, ${availabilityColumn} FROM tickets WHERE train_number = ? LIMIT 1`;

        db.query(query, [trainNumber], (err, results) => {
            if (err) {
                return reject(err);  // 查询失败，返回错误
            }

            if (results.length === 0) {
                return reject(new Error('车次不存在'));
            }

            const ticketId = results[0].id;
            const availability = results[0][availabilityColumn];

            resolve({ ticketId, availability });
        });
    });
}
//检查余量的接口
app.get('/trains/checkAvailability', (req, res) => {
    const { trainNumber, seatType } = req.query;

    // 调用公共查询函数
    getSeatAvailability(trainNumber, seatType)
        .then(({ ticketId, availability }) => {
            // 记录日志
            logger.info(`检查余票请求: 车次号=${trainNumber}, 座位类型=${seatType}, ticket_id=${ticketId}, 余票数量=${availability}, 请求时间=${new Date().toISOString()}`);

            // 返回是否有余票
            res.json({ available: availability > 0 });
        })
        .catch(err => {
            console.error('查询失败:', err);
            if (err.message === 'Invalid seat type') {
                return res.status(400).json({ error: 'Invalid seat type' });
            } else if (err.message === '车次不存在') {
                return res.status(404).json({ message: '车次不存在' });
            } else {
                return res.status(500).json({ error: 'Internal server error' });
            }
        });
});
//日志读取
function getLatestLogData() {
    return new Promise((resolve, reject) => {
        // 确认日志文件路径
        const logFilePath = path.resolve(__dirname, 'app.log');  // 修改为正确的日志文件路径
        console.log('日志文件路径:', logFilePath);  // 输出日志文件路径用于调试

        const logStream = fs.createReadStream(logFilePath, { encoding: 'utf8' });
        const rl = readline.createInterface({
            input: logStream,
            output: process.stdout,
            terminal: false
        });

        let userId = null;
        let ticketId = null;
        let seatType = null;
        let latestLoginLog = null;
        let latestTicketLog = null;

        rl.on('line', (line) => {
            try {
                const log = JSON.parse(line);

                // 只处理用户登录成功和检查余票请求日志
                if (log.message.includes('用户登录成功')) {
                    latestLoginLog = log;
                    userId = log.message.match(/用户ID=(\d+)/)[1];
                }

                if (log.message.includes('检查余票请求')) {
                    latestTicketLog = log;
                    ticketId = log.message.match(/ticket_id=(\d+)/)[1];
                    seatType = log.message.match(/座位类型=(\w+)/)[1];
                }
            } catch (error) {
                console.error('日志解析失败:', error);
            }
        });

        rl.on('close', () => {
            // 在文件读取完毕后，返回最后匹配的日志数据
            if (latestLoginLog && latestTicketLog) {
                console.log('最新的用户登录成功日志:', latestLoginLog);
                console.log('最新的检查余票请求日志:', latestTicketLog);
                resolve({ userId, ticketId, seatType });
            } else {
                reject('未找到足够的日志信息');
            }
        });

        rl.on('error', (err) => {
            reject('读取日志文件失败:', err);
        });
    });
}

// 购票接口
app.post('/purchase', async (req, res) => {
    try {
        // 获取请求体中的数据
        const { num_tickets } = req.body;

        // 获取最新的日志数据 (获取最近一次的用户登录和余票检查)
        const { userId, ticketId, seatType } = await getLatestLogData();

        console.log('获取到的最新日志数据:', { userId, ticketId, seatType });  // 打印日志数据，检查是否缺少值

        if (!userId || !ticketId || !seatType) {
            return res.status(400).json({
                success: false,
                message: '缺少必要的参数：用户ID、票ID或座位类型'
            });
        }

        const bookingResult = await createBooking(userId, ticketId, seatType, num_tickets);

        // 返回购票成功的响应
        res.status(200).json({
            success: true,
            message: '购票成功',
            bookingDetails: bookingResult
        });
    } catch (error) {
        console.error('处理购票请求失败:', error);
        res.status(500).json({ success: false, message: '购票失败', error: error.message });
    }
});

// 插入预定记录的函数
async function createBooking(userId, ticketId, seatType,num_tickets) {
    console.log('Creating booking with:', userId, ticketId, seatType); // 调试日志

    // 进行参数检查，确保它们不是 undefined
    if (userId === undefined || ticketId === undefined || seatType === undefined) {
        throw new Error('必要的参数缺失');
    }
    const updateSeatsQuery = `
            UPDATE tickets
            SET ${getSeatAvailabilityColumn(seatType)} = ${getSeatAvailabilityColumn(seatType)} - ?
            WHERE id = ?
        `;
        await db.promise().query(updateSeatsQuery, [1, ticketId]);
    // 假设这里是 SQL 查询的部分
    const query = `
        INSERT INTO booking (user_id, ticket_id, seat_type, num_tickets, booking_date)
        VALUES (?, ?, ?, ?, ?)
    `;

    const values = [userId, ticketId, seatType, num_tickets,new Date()];

    try {
        const [result] = await db.promise().execute(query, values); // 使用 MySQL2 的 execute 方法
        console.log('预定记录插入成功:', result);
        return result;  // 返回插入结果
    } catch (error) {
        console.error('数据库操作失败:', error);
        throw error;  // 抛出错误，方便上层捕获
    }
}
// 查看已定车票接口
app.get('/booking', async (req, res) => {
    try {
        // 获取最新的日志数据
        const logData = await getLatestLogData();

        // 解构出 userId, 如果没有获取到有效的 logData, 返回 400 错误
        const { userId } = logData || {}; 

        if (!userId) {
            return res.status(400).json({ success: false, message: '未找到有效的用户ID' });
        }

        // 查询用户已预定的车票信息
        const query = `
            SELECT booking.id AS booking_id, booking.num_tickets, tickets.train_number, 
                   tickets.departure_location, tickets.destination_location, 
                   tickets.departure_time, tickets.arrival_time,booking.seat_type
            FROM booking
            JOIN tickets ON booking.ticket_id = tickets.id
            WHERE booking.user_id = ?
        `;
        
        // 使用 Promise 的方式来执行数据库查询
        const [results] = await db.promise().query(query, [userId]);
        const seatTypeMap = {
            'first_class': '一等座',
            'second_class': '二等座',
            'sleeper_class': '二等卧',
            'first_sleeper_class': '一等卧'
        };
        // 如果没有找到任何已定车票
        if (results.length === 0) {
            return res.status(404).json({ message: '没有已定车票' });
        }
        const updatedResults = results.map(item => {
            item.seat_type = seatTypeMap[item.seat_type] || '未知座位类型';  // 如果没有匹配类型，显示 '未知座位类型'
            return item;
        });

        // 返回已定车票信息
        res.status(200).json({
            success: true,
            bookings: updatedResults
        });
    } catch (error) {
        // 错误日志和响应
        console.error('处理请求失败:', error);
        res.status(500).json({ success: false, message: '获取预定记录失败', error: error.message });
    }
});


app.post('/cancel-ticket', async (req, res) => {
    try {
        const { ticketId } = req.body;  // 获取前端传过来的车票ID

        if (!ticketId) {
            return res.status(400).json({ success: false, message: '缺少车票ID' });
        }

        // 删除对应的购票记录
        const query = 'DELETE FROM booking WHERE id = ?';  // 假设我们用 'id' 来标识购票记录
        db.query(query, [ticketId], (err, results) => {
            if (err) {
                console.error('数据库错误:', err);
                return res.status(500).json({ success: false, message: '数据库错误' });
            }

            // 如果没有删除任何记录，说明车票ID无效
            if (results.affectedRows === 0) {
                return res.status(404).json({ success: false, message: '未找到该车票' });
            }

            // 删除成功
            res.status(200).json({ success: true, message: '退票成功' });
        });

    } catch (error) {
        console.error('处理退票请求失败:', error);
        res.status(500).json({ success: false, message: '退票请求处理失败', error: error.message });
    }
});
app.post('/group-purchase', async (req, res) => {
    const { usernames } = req.body;  // 从请求中获取团体成员的用户名列表

    if (!usernames || usernames.length === 0) {
        return res.status(400).json({ success: false, message: '无效的用户名列表' });
    }

    try {
        console.log('请求的团体成员用户名:', usernames);

        // 检查所有用户名是否存在于users表中
        const userCheckQuery = `SELECT username, id FROM users WHERE username IN (?)`;
        const [userRows] = await db.promise().query(userCheckQuery, [usernames]);

        console.log('查询到的用户:', userRows);

        // 如果返回的用户名数量与传入的用户名数量不同，则有用户不存在
        if (userRows.length !== usernames.length) {
            console.log('某些用户名不存在');
            return res.status(400).json({ success: false, message: '某些用户名不存在' });
        }

        // 获取最新的车次号和座位类型
        const logData = await getLatestLogData();
        console.log('获取到的日志数据:', logData);

        // 解构出 ticketId 和 seatType, 如果没有获取到有效的 logData, 返回 500 错误
        const { ticketId, seatType } = logData || {}; 
        if (!ticketId || !seatType) {
            console.log('无法获取最新的车次信息或座位类型');
            return res.status(500).json({ success: false, message: '无法获取最新的车次信息或座位类型' });
        }

        const [rows] = await db.promise().query('SELECT train_number FROM tickets WHERE id = ?', [ticketId]);
        const trainNumber = rows.length > 0 ? rows[0].train_number : null;
        // 检查余票是否足够
        const { availability } = await getSeatAvailability(trainNumber, seatType);  // 检查指定 ticketId 和 seatType 的余票
        console.log(`票种 ${seatType} 的余票数量:`, availability);

        if (availability < usernames.length) {
            console.log('余票不足');
            return res.status(400).json({ success: false, message: '余票不足' });
        }

        // 扣除每个团体成员的票
        const updateSeatsQuery = `
            UPDATE tickets
            SET ${getSeatAvailabilityColumn(seatType)} = ${getSeatAvailabilityColumn(seatType)} - ?
            WHERE id = ?
        `;
        console.log('执行更新余票查询:', updateSeatsQuery);
        await db.promise().query(updateSeatsQuery, [usernames.length, ticketId]);

        // 为每个团体成员生成购票记录
        const insertBookingQuery = `
            INSERT INTO booking (user_id, ticket_id, seat_type, num_tickets, booking_date)
            VALUES (?, ?, ?, 1, NOW())
        `;
        console.log('插入购票记录的 SQL:', insertBookingQuery);

        for (let username of usernames) {
            const user = userRows.find(user => user.username === username);
            if (user) {
                console.log(`为用户 ${username} 插入购票记录`);
                // 插入购票记录
                await db.promise().query(insertBookingQuery, [user.id, ticketId, seatType]);
            }
        }

        return res.status(200).json({ success: true, message: '团体购票成功' });

    } catch (error) {
        console.error('购票失败:', error);
        return res.status(500).json({ success: false, message: '购票失败，请稍后再试' });
    }
});

// 获取订单信息的 API  
app.get('/api/orders', (req, res) => {  
    const query = 'SELECT * FROM orders';   

    db.query(query, (err, results) => { // 使用回调风格查询  
        if (err) {  
            console.error("数据库查询错误:", err); // 在控制台输出错误信息  
            return res.status(500).json({ error: err.message }); // 返回500错误  
        }  
        res.json(results); // 返回结果  
    });  
}); 

// 获取所有管理员的信息（包括薪资）
app.get('/api/admins/salary', (req, res) => {
    const query = 'SELECT id, username, salary FROM admins'; // 获取管理员用户名和薪资
    db.query(query, (err, results) => {
        if (err) {
            console.error('查询管理员数据失败:', err);
            return res.status(500).json({ error: '查询失败' });
        }
        res.json(results);
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器正在 http://localhost:${PORT}/ 运行.`);
});

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: admins
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `admins` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `salary` decimal(10, 2) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 3 DEFAULT CHARSET = utf8mb3;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: booking
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `booking` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `ticket_id` int NOT NULL,
  `seat_type` varchar(50) NOT NULL,
  `num_tickets` int NOT NULL,
  `booking_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `ticket_id` (`ticket_id`),
  CONSTRAINT `booking_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `booking_ibfk_2` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 65 DEFAULT CHARSET = utf8mb3;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: tickets
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `tickets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `train_number` varchar(50) NOT NULL,
  `departure_location` varchar(255) NOT NULL,
  `destination_location` varchar(255) NOT NULL,
  `departure_time` timestamp NULL DEFAULT NULL,
  `arrival_time` timestamp NULL DEFAULT NULL,
  `first_class_price` decimal(10, 2) NOT NULL,
  `first_class_availability` int NOT NULL,
  `second_class_price` decimal(10, 2) NOT NULL,
  `second_class_availability` int NOT NULL,
  `sleeper_class_price` decimal(10, 2) NOT NULL,
  `sleeper_class_availability` int NOT NULL,
  `first_sleeper_class_price` decimal(10, 2) NOT NULL,
  `first_sleeper_class_availability` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 36 DEFAULT CHARSET = utf8mb3;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: users
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 11 DEFAULT CHARSET = utf8mb3;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: orders
# ------------------------------------------------------------

CREATE OR REPLACE VIEW `orders` AS
select
  `b`.`ticket_id` AS `ticket_id`,
  `t`.`departure_location` AS `departure_location`,
  `t`.`destination_location` AS `destination_location`,
  `t`.`departure_time` AS `departure_time`,
  `t`.`arrival_time` AS `arrival_time`,
  `b`.`seat_type` AS `seat_type`,
  sum(`b`.`num_tickets`) AS `total_tickets`,(
  case
    when (`b`.`seat_type` = 'first_class') then `t`.`first_class_price`
    when (`b`.`seat_type` = 'second_class') then `t`.`second_class_price`
    when (`b`.`seat_type` = 'sleeper_class') then `t`.`sleeper_class_price`
    when (`b`.`seat_type` = 'first_sleeper_class') then `t`.`first_sleeper_class_price`
  end
  ) AS `ticket_price`,(
  sum(`b`.`num_tickets`) * (
    case
    when (`b`.`seat_type` = 'first_class') then `t`.`first_class_price`
    when (`b`.`seat_type` = 'second_class') then `t`.`second_class_price`
    when (`b`.`seat_type` = 'sleeper_class') then `t`.`sleeper_class_price`
    when (`b`.`seat_type` = 'first_sleeper_class') then `t`.`first_sleeper_class_price`
    end
  )
  ) AS `total_price`
from
  (
  `booking` `b`
  join `tickets` `t` on((`b`.`ticket_id` = `t`.`id`))
  )
group by
  `b`.`ticket_id`,
  `b`.`seat_type`,
  `t`.`departure_location`,
  `t`.`destination_location`,
  `t`.`departure_time`,
  `t`.`arrival_time`;

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: admins
# ------------------------------------------------------------

INSERT INTO
  `admins` (
    `id`,
    `username`,
    `password`,
    `created_at`,
    `updated_at`,
    `salary`
  )
VALUES
  (
    2,
    'admin',
    'admin123',
    '2024-12-10 22:07:22',
    '2024-12-10 22:07:22',
    5000.00
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: booking
# ------------------------------------------------------------

INSERT INTO
  `booking` (
    `id`,
    `user_id`,
    `ticket_id`,
    `seat_type`,
    `num_tickets`,
    `booking_date`
  )
VALUES
  (
    6,
    3,
    24,
    'first_sleeper_class',
    1,
    '2024-12-12 15:06:44'
  );
INSERT INTO
  `booking` (
    `id`,
    `user_id`,
    `ticket_id`,
    `seat_type`,
    `num_tickets`,
    `booking_date`
  )
VALUES
  (
    9,
    3,
    24,
    'first_sleeper_class',
    1,
    '2024-12-12 15:47:58'
  );
INSERT INTO
  `booking` (
    `id`,
    `user_id`,
    `ticket_id`,
    `seat_type`,
    `num_tickets`,
    `booking_date`
  )
VALUES
  (10, 4, 33, 'first_class', 1, '2024-12-12 16:33:29');
INSERT INTO
  `booking` (
    `id`,
    `user_id`,
    `ticket_id`,
    `seat_type`,
    `num_tickets`,
    `booking_date`
  )
VALUES
  (12, 7, 31, 'first_class', 1, '2024-12-12 17:30:18');
INSERT INTO
  `booking` (
    `id`,
    `user_id`,
    `ticket_id`,
    `seat_type`,
    `num_tickets`,
    `booking_date`
  )
VALUES
  (49, 8, 31, 'second_class', 1, '2024-12-12 19:08:41');
INSERT INTO
  `booking` (
    `id`,
    `user_id`,
    `ticket_id`,
    `seat_type`,
    `num_tickets`,
    `booking_date`
  )
VALUES
  (50, 6, 33, 'sleeper_class', 1, '2024-12-12 19:09:15');
INSERT INTO
  `booking` (
    `id`,
    `user_id`,
    `ticket_id`,
    `seat_type`,
    `num_tickets`,
    `booking_date`
  )
VALUES
  (51, 3, 33, 'sleeper_class', 1, '2024-12-12 19:09:15');
INSERT INTO
  `booking` (
    `id`,
    `user_id`,
    `ticket_id`,
    `seat_type`,
    `num_tickets`,
    `booking_date`
  )
VALUES
  (52, 5, 33, 'sleeper_class', 1, '2024-12-12 19:09:15');
INSERT INTO
  `booking` (
    `id`,
    `user_id`,
    `ticket_id`,
    `seat_type`,
    `num_tickets`,
    `booking_date`
  )
VALUES
  (53, 4, 33, 'sleeper_class', 1, '2024-12-12 19:09:15');
INSERT INTO
  `booking` (
    `id`,
    `user_id`,
    `ticket_id`,
    `seat_type`,
    `num_tickets`,
    `booking_date`
  )
VALUES
  (54, 7, 33, 'sleeper_class', 1, '2024-12-12 19:09:15');
INSERT INTO
  `booking` (
    `id`,
    `user_id`,
    `ticket_id`,
    `seat_type`,
    `num_tickets`,
    `booking_date`
  )
VALUES
  (56, 6, 31, 'sleeper_class', 1, '2024-12-12 20:03:47');
INSERT INTO
  `booking` (
    `id`,
    `user_id`,
    `ticket_id`,
    `seat_type`,
    `num_tickets`,
    `booking_date`
  )
VALUES
  (57, 3, 31, 'sleeper_class', 1, '2024-12-12 20:03:47');
INSERT INTO
  `booking` (
    `id`,
    `user_id`,
    `ticket_id`,
    `seat_type`,
    `num_tickets`,
    `booking_date`
  )
VALUES
  (58, 5, 31, 'sleeper_class', 1, '2024-12-12 20:03:47');
INSERT INTO
  `booking` (
    `id`,
    `user_id`,
    `ticket_id`,
    `seat_type`,
    `num_tickets`,
    `booking_date`
  )
VALUES
  (59, 4, 31, 'sleeper_class', 1, '2024-12-12 20:03:47');
INSERT INTO
  `booking` (
    `id`,
    `user_id`,
    `ticket_id`,
    `seat_type`,
    `num_tickets`,
    `booking_date`
  )
VALUES
  (60, 7, 31, 'sleeper_class', 1, '2024-12-12 20:03:47');
INSERT INTO
  `booking` (
    `id`,
    `user_id`,
    `ticket_id`,
    `seat_type`,
    `num_tickets`,
    `booking_date`
  )
VALUES
  (61, 8, 31, 'sleeper_class', 1, '2024-12-12 20:03:47');
INSERT INTO
  `booking` (
    `id`,
    `user_id`,
    `ticket_id`,
    `seat_type`,
    `num_tickets`,
    `booking_date`
  )
VALUES
  (62, 10, 31, 'sleeper_class', 1, '2024-12-12 20:03:47');
INSERT INTO
  `booking` (
    `id`,
    `user_id`,
    `ticket_id`,
    `seat_type`,
    `num_tickets`,
    `booking_date`
  )
VALUES
  (63, 9, 31, 'sleeper_class', 1, '2024-12-12 20:03:47');
INSERT INTO
  `booking` (
    `id`,
    `user_id`,
    `ticket_id`,
    `seat_type`,
    `num_tickets`,
    `booking_date`
  )
VALUES
  (
    64,
    8,
    35,
    'first_sleeper_class',
    1,
    '2024-12-28 15:12:55'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: tickets
# ------------------------------------------------------------

INSERT INTO
  `tickets` (
    `id`,
    `train_number`,
    `departure_location`,
    `destination_location`,
    `departure_time`,
    `arrival_time`,
    `first_class_price`,
    `first_class_availability`,
    `second_class_price`,
    `second_class_availability`,
    `sleeper_class_price`,
    `sleeper_class_availability`,
    `first_sleeper_class_price`,
    `first_sleeper_class_availability`
  )
VALUES
  (
    24,
    'g106',
    '北京',
    '上海',
    '2024-12-20 15:12:00',
    '2024-12-21 12:12:00',
    300.00,
    99,
    180.00,
    200,
    450.00,
    50,
    600.00,
    15
  );
INSERT INTO
  `tickets` (
    `id`,
    `train_number`,
    `departure_location`,
    `destination_location`,
    `departure_time`,
    `arrival_time`,
    `first_class_price`,
    `first_class_availability`,
    `second_class_price`,
    `second_class_availability`,
    `sleeper_class_price`,
    `sleeper_class_availability`,
    `first_sleeper_class_price`,
    `first_sleeper_class_availability`
  )
VALUES
  (
    31,
    'bai520',
    '哈尔滨',
    '成都',
    '2025-01-04 21:10:00',
    '2025-01-05 18:11:00',
    1400.00,
    280,
    980.00,
    499,
    1600.00,
    192,
    2000.00,
    35
  );
INSERT INTO
  `tickets` (
    `id`,
    `train_number`,
    `departure_location`,
    `destination_location`,
    `departure_time`,
    `arrival_time`,
    `first_class_price`,
    `first_class_availability`,
    `second_class_price`,
    `second_class_availability`,
    `sleeper_class_price`,
    `sleeper_class_availability`,
    `first_sleeper_class_price`,
    `first_sleeper_class_availability`
  )
VALUES
  (
    33,
    'D202',
    '广州',
    '深圳',
    '2024-12-16 09:30:00',
    '2024-12-16 11:00:00',
    350.00,
    60,
    200.00,
    120,
    180.00,
    95,
    500.00,
    30
  );
INSERT INTO
  `tickets` (
    `id`,
    `train_number`,
    `departure_location`,
    `destination_location`,
    `departure_time`,
    `arrival_time`,
    `first_class_price`,
    `first_class_availability`,
    `second_class_price`,
    `second_class_availability`,
    `sleeper_class_price`,
    `sleeper_class_availability`,
    `first_sleeper_class_price`,
    `first_sleeper_class_availability`
  )
VALUES
  (
    34,
    'G101',
    '西安',
    '北京',
    '2024-12-27 20:05:00',
    '2024-12-28 10:05:00',
    560.00,
    80,
    280.00,
    160,
    560.00,
    80,
    720.00,
    60
  );
INSERT INTO
  `tickets` (
    `id`,
    `train_number`,
    `departure_location`,
    `destination_location`,
    `departure_time`,
    `arrival_time`,
    `first_class_price`,
    `first_class_availability`,
    `second_class_price`,
    `second_class_availability`,
    `sleeper_class_price`,
    `sleeper_class_availability`,
    `first_sleeper_class_price`,
    `first_sleeper_class_availability`
  )
VALUES
  (
    35,
    'G103',
    '西安',
    '内蒙古',
    '2024-12-27 20:05:00',
    '2024-12-28 10:05:00',
    560.00,
    80,
    280.00,
    240,
    560.00,
    180,
    720.00,
    59
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: users
# ------------------------------------------------------------

INSERT INTO
  `users` (`id`, `username`, `password`)
VALUES
  (
    3,
    'dong',
    '$2a$10$7XwzwygnZZDo52NtXVjHzeExgI8YoUD9iaYpEq.cVduJhlS8QlIqy'
  );
INSERT INTO
  `users` (`id`, `username`, `password`)
VALUES
  (
    4,
    'cui1',
    '$2a$10$Lzl.2BEv5JiiBQvGJjyATOKjYL8uqQ2.wobwF.xQq1SgEMyUSC60G'
  );
INSERT INTO
  `users` (`id`, `username`, `password`)
VALUES
  (
    5,
    'baiyut',
    '$2a$10$S4FrTcZhYUi7UlN/D7d.cOG2cJRGX5MlqqppdA86ixC5Rr/7FpVpy'
  );
INSERT INTO
  `users` (`id`, `username`, `password`)
VALUES
  (
    6,
    'user1',
    '$2a$10$33GFyW0B16.Cirm.XoywFemB5oQtSUON2eC9NbHUnuiUPTjPnFf3W'
  );
INSERT INTO
  `users` (`id`, `username`, `password`)
VALUES
  (
    7,
    '1111',
    '$2a$10$a9uxziENzCx66JGyp8HNH.5Tz5bVsf3N8nIMr8lrfSEB5mdvr4OZ2'
  );
INSERT INTO
  `users` (`id`, `username`, `password`)
VALUES
  (
    8,
    'hou1',
    '$2a$10$2ZvIDWK0jD193yws4nHb7.BsFstjrswDPRgTI4b5zF7hA/HXp2etq'
  );
INSERT INTO
  `users` (`id`, `username`, `password`)
VALUES
  (
    9,
    'dong2',
    '$2a$10$Pdd2JOnbPRoMauZjXzkE1.VmoHM6dcHinU7Um/PjVG72mWx1uirAu'
  );
INSERT INTO
  `users` (`id`, `username`, `password`)
VALUES
  (
    10,
    'user2',
    '$2a$10$9Z39vUOAmOgD/YTykXPDNuWeXXWHIv1YSlu.PrExZmWP.ITjr7kFy'
  );

/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

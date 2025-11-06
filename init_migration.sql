CREATE DATABASE IF NOT EXISTS transcript CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE transcript;

-- App-wide settings (prices, toggles)
CREATE TABLE settings (
  id            BIGINT PRIMARY KEY AUTO_INCREMENT,
  key_name      VARCHAR(80) NOT NULL UNIQUE,
  value_json    JSON NOT NULL,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- App users (students only for now)
CREATE TABLE students (
  id                BIGINT PRIMARY KEY AUTO_INCREMENT,
  matric_no         VARCHAR(64) NOT NULL UNIQUE,
  password_hash     VARCHAR(255) NOT NULL,
  email             VARCHAR(160) NULL,
  phone             VARCHAR(40)  NULL,
  full_name         VARCHAR(160) NULL,      -- duplicated for convenience
  department        VARCHAR(160) NULL,
  school            VARCHAR(160) NULL,
  level             VARCHAR(40)  NULL,
  entry_session     VARCHAR(40)  NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Payment records (Paystack)
CREATE TABLE payments (
  id                BIGINT PRIMARY KEY AUTO_INCREMENT,
  student_id        BIGINT NOT NULL,
  gateway           ENUM('PAYSTACK') NOT NULL,
  reference         VARCHAR(100) NOT NULL UNIQUE,    -- paystack reference
  amount_kobo       BIGINT NOT NULL,                 -- store minor units
  currency          CHAR(3) NOT NULL DEFAULT 'NGN',
  status            ENUM('INITIATED','SUCCESS','FAILED') NOT NULL DEFAULT 'INITIATED',
  paid_at           DATETIME NULL,
  raw_init_json     JSON NULL,   -- initialize response
  raw_verify_json   JSON NULL,   -- verify/webhook
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_student FOREIGN KEY (student_id) REFERENCES students(id)
);

-- Transcript request main record
CREATE TABLE transcript_requests (
  id                BIGINT PRIMARY KEY AUTO_INCREMENT,
  student_id        BIGINT NOT NULL,
  payment_id        BIGINT NULL,          -- set after payment success
  scope             ENUM('WITHIN_NG','OUTSIDE_NG') NOT NULL,
  request_email     VARCHAR(160) NOT NULL, -- student contact for this request
  status            ENUM('DRAFT','PAYMENT_PENDING','PAID','SUBMITTED','PROCESSING','SENT','CANCELLED') NOT NULL DEFAULT 'DRAFT',
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_req_student FOREIGN KEY (student_id) REFERENCES students(id),
  CONSTRAINT fk_req_payment FOREIGN KEY (payment_id) REFERENCES payments(id)
);

-- Destination details (1..N if you later support multiple receivers per request)
CREATE TABLE destinations (
  id                BIGINT PRIMARY KEY AUTO_INCREMENT,
  request_id        BIGINT NOT NULL,
  institution_name  VARCHAR(200) NOT NULL,
  country           VARCHAR(100) NOT NULL,
  address_line1     VARCHAR(200) NOT NULL,
  address_line2     VARCHAR(200) NULL,
  city              VARCHAR(120) NULL,
  state_region      VARCHAR(120) NULL,
  postal_code       VARCHAR(40)  NULL,
  email_recipient   VARCHAR(160) NULL,     -- electronic delivery (if provided)
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_dest_request FOREIGN KEY (request_id) REFERENCES transcript_requests(id)
);

-- Status timeline (auditable)
CREATE TABLE status_events (
  id             BIGINT PRIMARY KEY AUTO_INCREMENT,
  request_id     BIGINT NOT NULL,
  status         ENUM('DRAFT','PAYMENT_PENDING','PAID','SUBMITTED','PROCESSING','SENT','CANCELLED') NOT NULL,
  note           VARCHAR(300) NULL,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_statusevents_request FOREIGN KEY (request_id) REFERENCES transcript_requests(id),
  INDEX idx_status_req (request_id, created_at)
);

-- Simple view for history (optional convenience)
CREATE VIEW v_student_history AS
SELECT r.id request_id, r.status, r.created_at, p.status payment_status, p.amount_kobo, p.paid_at
FROM transcript_requests r
LEFT JOIN payments p ON p.id = r.payment_id;




INSERT INTO settings (key_name, value_json) VALUES
('TRANSCRIPT_PRICING', JSON_OBJECT(
  'WITHIN_NG', JSON_OBJECT('amountNGN', 5000),
  'OUTSIDE_NG', JSON_OBJECT('amountNGN', 20000)
));

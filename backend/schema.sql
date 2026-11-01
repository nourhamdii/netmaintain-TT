-- Schéma de référence (le serveur crée automatiquement la base et la table au démarrage)
CREATE DATABASE IF NOT EXISTS netmaintain CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE netmaintain;

CREATE TABLE IF NOT EXISTS tickets (
  id          VARCHAR(20)  NOT NULL PRIMARY KEY,           -- ex: TT-2026-101
  service     ENUM('Fibre Optique','ADSL','Mobile','Ligne Fixe') NOT NULL,
  delegation  VARCHAR(60)  NOT NULL,
  priority    ENUM('Basse','Moyenne','Haute') NOT NULL DEFAULT 'Moyenne',
  description TEXT         NOT NULL,
  status      ENUM('en_cours','resolu') NOT NULL DEFAULT 'en_cours',
  created_at  DATETIME     NOT NULL,                       -- stocké en UTC
  resolved_at DATETIME     NULL,
  INDEX idx_status (status),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

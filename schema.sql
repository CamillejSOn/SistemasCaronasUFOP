-- ============================================================
-- UFOP Caronas - Schema do Banco de Dados
-- ============================================================

-- Limpa banco se necessário
DROP TABLE IF EXISTS reservas CASCADE;
DROP TABLE IF EXISTS caronas CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- Tabela de Usuários
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    cidade_base VARCHAR(100) NOT NULL,
    curso VARCHAR(100),
    telefone VARCHAR(20),
    eh_admin BOOLEAN DEFAULT FALSE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Caronas
CREATE TABLE caronas (
    id SERIAL PRIMARY KEY,
    motorista_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    origem VARCHAR(150) NOT NULL,
    destino VARCHAR(150) NOT NULL,
    data_viagem DATE NOT NULL,
    horario TIME NOT NULL,
    vagas_total INTEGER NOT NULL CHECK (vagas_total > 0),
    vagas_disponiveis INTEGER NOT NULL CHECK (vagas_disponiveis >= 0),
    valor_contribuicao DECIMAL(8,2) DEFAULT 0,
    observacoes TEXT,
    status VARCHAR(20) DEFAULT 'ativa' CHECK (status IN ('ativa', 'cancelada', 'concluida')),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Reservas (N:M entre usuarios e caronas)
CREATE TABLE reservas (
    id SERIAL PRIMARY KEY,
    passageiro_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    carona_id INTEGER NOT NULL REFERENCES caronas(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'confirmada' CHECK (status IN ('confirmada', 'cancelada')),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(passageiro_id, carona_id)
);

-- Índices para performance
CREATE INDEX idx_caronas_origem ON caronas(origem);
CREATE INDEX idx_caronas_destino ON caronas(destino);
CREATE INDEX idx_caronas_data ON caronas(data_viagem);
CREATE INDEX idx_caronas_status ON caronas(status);
CREATE INDEX idx_reservas_passageiro ON reservas(passageiro_id);
CREATE INDEX idx_reservas_carona ON reservas(carona_id);

-- ============================================================
-- Função para decrementar vagas ao reservar
-- ============================================================
CREATE OR REPLACE FUNCTION atualizar_vagas()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'confirmada' THEN
        UPDATE caronas SET vagas_disponiveis = vagas_disponiveis - 1
        WHERE id = NEW.carona_id AND vagas_disponiveis > 0;
    ELSIF TG_OP = 'UPDATE' AND OLD.status = 'confirmada' AND NEW.status = 'cancelada' THEN
        UPDATE caronas SET vagas_disponiveis = vagas_disponiveis + 1
        WHERE id = NEW.carona_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_vagas
AFTER INSERT OR UPDATE ON reservas
FOR EACH ROW EXECUTE FUNCTION atualizar_vagas();

COMMENT ON TABLE usuarios IS 'Usuários do sistema (motoristas e passageiros)';
COMMENT ON TABLE caronas IS 'Caronas oferecidas pelos motoristas';
COMMENT ON TABLE reservas IS 'Reservas de vagas feitas pelos passageiros';

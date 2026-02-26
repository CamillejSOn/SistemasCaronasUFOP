-- ============================================================
-- UFOP Caronas - João Monlevade (ICEA)
-- Dados Fictícios para Testes
-- Senhas: todos os usuários têm senha "senha123"
-- Hash bcrypt de "senha123":
-- $2a$10$LOy2PlDODlEIbhgAf0dkgOGstx4sR/zhGzgjA2CrYLhVyeg603dzi
-- ============================================================

-- =========================
-- Usuários fictícios
-- =========================
INSERT INTO usuarios (nome, email, senha_hash, cidade_base, curso, telefone, eh_admin) VALUES
('Admin UFOP JM', 'admin.jm@ufop.br',
 '$2a$10$LOy2PlDODlEIbhgAf0dkgOGstx4sR/zhGzgjA2CrYLhVyeg603dzi',
 'João Monlevade', 'Engenharia de Produção', '(31) 99999-0000', TRUE),

('Lucas Ferreira', 'lucas.jm@aluno.ufop.br',
 '$2a$10$LOy2PlDODlEIbhgAf0dkgOGstx4sR/zhGzgjA2CrYLhVyeg603dzi',
 'João Monlevade', 'Engenharia de Computação', '(31) 98765-1234', FALSE),

('Mariana Costa', 'mariana.jm@aluno.ufop.br',
 '$2a$10$LOy2PlDODlEIbhgAf0dkgOGstx4sR/zhGzgjA2CrYLhVyeg603dzi',
 'João Monlevade', 'Sistemas de Informação', '(31) 91234-5678', FALSE),

('Pedro Oliveira', 'pedro.jm@aluno.ufop.br',
 '$2a$10$LOy2PlDODlEIbhgAf0dkgOGstx4sR/zhGzgjA2CrYLhVyeg603dzi',
 'João Monlevade', 'Engenharia de Produção', '(31) 99876-4321', FALSE),

('Ana Souza', 'ana.jm@aluno.ufop.br',
 '$2a$10$LOy2PlDODlEIbhgAf0dkgOGstx4sR/zhGzgjA2CrYLhVyeg603dzi',
 'João Monlevade', 'Sistemas de Informação', '(31) 98765-8765', FALSE),

('Carlos Mendes', 'carlos.jm@aluno.ufop.br',
 '$2a$10$LOy2PlDODlEIbhgAf0dkgOGstx4sR/zhGzgjA2CrYLhVyeg603dzi',
 'João Monlevade', 'Engenharia Elétrica', '(31) 99111-2222', FALSE),

('Beatriz Lima', 'beatriz.jm@aluno.ufop.br',
 '$2a$10$LOy2PlDODlEIbhgAf0dkgOGstx4sR/zhGzgjA2CrYLhVyeg603dzi',
 'João Monlevade', 'Engenharia de Produção', '(31) 99333-4444', FALSE),

('Rafael Santos', 'rafael.jm@aluno.ufop.br',
 '$2a$10$LOy2PlDODlEIbhgAf0dkgOGstx4sR/zhGzgjA2CrYLhVyeg603dzi',
 'João Monlevade', 'Engenharia Elétrica', '(31) 99555-6666', FALSE),

('Isabela Rocha', 'isabela.jm@aluno.ufop.br',
 '$2a$10$LOy2PlDODlEIbhgAf0dkgOGstx4sR/zhGzgjA2CrYLhVyeg603dzi',
 'João Monlevade', 'Engenharia de Computação', '(31) 99777-8888', FALSE),

('Thiago Nunes', 'thiago.jm@aluno.ufop.br',
 '$2a$10$LOy2PlDODlEIbhgAf0dkgOGstx4sR/zhGzgjA2CrYLhVyeg603dzi',
 'João Monlevade', 'Sistemas de Informação', '(31) 99000-1111', FALSE);

-- =========================
-- Caronas
-- =========================
INSERT INTO caronas (motorista_id, origem, destino, data_viagem, horario, vagas_total, vagas_disponiveis, valor_contribuicao, observacoes, status) VALUES
(2, 'Carneirinhos', 'ICEA - UFOP', CURRENT_DATE + 1, '07:00', 4, 3, 5.00, 'Saindo do centro, carro com ar condicionado.', 'ativa'),
(3, 'ICEA - UFOP', 'Carneirinhos', CURRENT_DATE + 1, '18:00', 3, 2, 5.00, 'Retorno após as aulas da noite.', 'ativa'),
(4, 'Loanda', 'ICEA - UFOP', CURRENT_DATE + 2, '07:30', 2, 1, 4.00, 'Passando pela avenida principal.', 'ativa'),
(2, 'Novo Cruzeiro', 'ICEA - UFOP', CURRENT_DATE + 3, '06:30', 4, 4, 6.00, 'Saindo cedo para primeira aula.', 'ativa'),
(6, 'Carneirinhos', 'ICEA - UFOP', CURRENT_DATE + 2, '08:00', 3, 3, 5.00, 'Saída próxima ao comércio.', 'ativa'),
(7, 'Baú', 'ICEA - UFOP', CURRENT_DATE + 4, '07:15', 2, 2, 4.00, 'Trajeto rápido.', 'ativa'),
(8, 'Centro Industrial', 'ICEA - UFOP', CURRENT_DATE + 1, '07:45', 3, 2, 5.00, 'Saindo do centro industrial.', 'ativa'),
(9, 'Loanda', 'ICEA - UFOP', CURRENT_DATE + 5, '06:00', 4, 4, 6.00, 'Para quem tem prova cedo.', 'ativa'),
(2, 'ICEA - UFOP', 'Carneirinhos', CURRENT_DATE - 5, '17:00', 4, 1, 5.00, NULL, 'concluida'),
(4, 'ICEA - UFOP', 'Novo Cruzeiro', CURRENT_DATE - 3, '07:00', 3, 0, 4.00, 'Trânsito intenso.', 'concluida'),
(3, 'ICEA - UFOP', 'Loanda', CURRENT_DATE - 1, '09:00', 2, 2, 4.00, NULL, 'cancelada'),
(6, 'Carneirinhos', 'Centro', CURRENT_DATE + 6, '06:00', 4, 3, 5.00, 'Trajeto direto.', 'ativa');

-- =========================
-- Reservas
-- =========================
INSERT INTO reservas (passageiro_id, carona_id, status) VALUES
(5, 1, 'confirmada'),
(9, 1, 'confirmada'),
(6, 2, 'confirmada'),
(5, 3, 'confirmada'),
(7, 7, 'confirmada'),
(4, 9, 'confirmada'),
(5, 9, 'confirmada'),
(6, 9, 'confirmada'),
(3, 10, 'confirmada'),
(5, 10, 'confirmada'),
(7, 10, 'confirmada'),
(9, 12, 'confirmada');

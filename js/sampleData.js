// ============================================
// SAMPLE DATA GENERATOR
// ============================================

const SampleDataGenerator = {
    generateSampleData() {
        // Clear existing data first
        const confirmation = confirm(
            'Isso irá adicionar dados de exemplo ao sistema. Continuar?'
        );

        if (!confirmation) return false;

        // Generate sample clients
        const clientes = this.generateClientes();
        clientes.forEach(cliente => storage.addCliente(cliente));

        // Generate sample agents
        const agentes = this.generateAgentes();
        agentes.forEach(agente => storage.addAgente(agente));

        // Generate sample apartments
        const apartamentos = this.generateApartamentos();
        const apartamentoIds = apartamentos.map(apt => storage.addApartamento(apt).id);

        // Generate sample reservations
        const clientesList = storage.getClientes();
        const agentesList = storage.getAgentes();
        const reservas = this.generateReservas(clientesList, apartamentoIds, agentesList);
        reservas.forEach(reserva => storage.addReserva(reserva));

        UI.showToast('Dados de exemplo criados com sucesso!', 'success');

        // Reload current module
        if (window.app && window.app.currentModule) {
            window.app.loadModule(window.app.currentModule);
        }

        return true;
    },

    generateClientes() {
        return [
            {
                nome: 'João Silva',
                email: 'joao.silva@email.com',
                telefone: '+44 20 7946 0958',
                cpf: '123.456.789-00',
                nacionalidade: 'Brasileiro',
                observacoes: 'Cliente VIP, prefere apartamentos com vista'
            },
            {
                nome: 'Maria Santos',
                email: 'maria.santos@email.com',
                telefone: '+44 20 7946 0959',
                cpf: '234.567.890-11',
                nacionalidade: 'Portuguesa',
                observacoes: 'Viaja frequentemente a trabalho'
            },
            {
                nome: 'Peter Johnson',
                email: 'peter.johnson@email.com',
                telefone: '+44 20 7946 0960',
                cpf: '345.678.901-22',
                nacionalidade: 'Britânico',
                observacoes: 'Primeira vez em Londres'
            },
            {
                nome: 'Ana Costa',
                email: 'ana.costa@email.com',
                telefone: '+44 20 7946 0961',
                cpf: '456.789.012-33',
                nacionalidade: 'Brasileira',
                observacoes: 'Estudante, estadias longas'
            },
            {
                nome: 'Carlos Mendes',
                email: 'carlos.mendes@email.com',
                telefone: '+44 20 7946 0962',
                cpf: '567.890.123-44',
                nacionalidade: 'Brasileiro',
                observacoes: 'Executivo, viagens mensais'
            }
        ];
    },

    generateAgentes() {
        return [
            {
                nome: 'Ricardo Almeida',
                email: 'ricardo@agency.com',
                telefone: '+44 20 7946 0970',
                agencia: 'London Properties Ltd',
                comissao: 10,
                observacoes: 'Agente parceiro principal'
            },
            {
                nome: 'Sofia Rodrigues',
                email: 'sofia@realestate.com',
                telefone: '+44 20 7946 0971',
                agencia: 'Real Estate Solutions',
                comissao: 12,
                observacoes: 'Especialista em estadias longas'
            }
        ];
    },

    generateApartamentos() {
        return [
            {
                cidade: 'London',
                endereco: '123 Baker Street, Westminster',
                valorSemanal: 850,
                valorMensal: 2800,
                descricao: 'Apartamento moderno no coração de Londres, próximo ao metrô',
                comodidades: 'WiFi, Cozinha equipada, Ar condicionado, TV Smart',
                quartos: 2,
                banheiros: 1,
                capacidade: 4,
                disponivel: true
            },
            {
                cidade: 'London',
                endereco: '45 Oxford Street, Soho',
                valorSemanal: 1200,
                valorMensal: 4000,
                descricao: 'Loft luxuoso em Soho, área nobre de Londres',
                comodidades: 'WiFi, Cozinha gourmet, Varanda, Garagem',
                quartos: 3,
                banheiros: 2,
                capacidade: 6,
                disponivel: true
            },
            {
                cidade: 'London',
                endereco: '78 Camden High Street, Camden',
                valorSemanal: 650,
                valorMensal: 2200,
                descricao: 'Apartamento aconchegante em Camden, área vibrante',
                comodidades: 'WiFi, Cozinha, Aquecimento central',
                quartos: 1,
                banheiros: 1,
                capacidade: 2,
                disponivel: false
            },
            {
                cidade: 'London',
                endereco: '92 Portobello Road, Notting Hill',
                valorSemanal: 950,
                valorMensal: 3200,
                descricao: 'Charmoso apartamento em Notting Hill',
                comodidades: 'WiFi, Cozinha equipada, Lavanderia, Jardim',
                quartos: 2,
                banheiros: 2,
                capacidade: 4,
                disponivel: true
            }
        ];
    },

    generateReservas(clientes, apartamentoIds, agentes) {
        const hoje = new Date();
        const reservas = [];

        // Reserva confirmada - check-in em 3 dias
        const reserva1CheckIn = new Date(hoje);
        reserva1CheckIn.setDate(hoje.getDate() + 3);
        const reserva1CheckOut = new Date(reserva1CheckIn);
        reserva1CheckOut.setDate(reserva1CheckIn.getDate() + 7);

        reservas.push({
            clienteId: clientes[0].id,
            apartamentoId: apartamentoIds[0],
            agenteId: agentes[0]?.id || null,
            checkIn: reserva1CheckIn.toISOString().split('T')[0],
            checkOut: reserva1CheckOut.toISOString().split('T')[0],
            valorTotal: 850,
            valorSinal: 250,
            valorRestante: 600,
            sinalPago: true,
            restantePago: false,
            status: 'confirmada',
            observacoes: 'Cliente solicitou check-in antecipado'
        });

        // Reserva confirmada - check-in em 5 dias
        const reserva2CheckIn = new Date(hoje);
        reserva2CheckIn.setDate(hoje.getDate() + 5);
        const reserva2CheckOut = new Date(reserva2CheckIn);
        reserva2CheckOut.setDate(reserva2CheckIn.getDate() + 14);

        reservas.push({
            clienteId: clientes[1].id,
            apartamentoId: apartamentoIds[1],
            agenteId: agentes[1]?.id || null,
            checkIn: reserva2CheckIn.toISOString().split('T')[0],
            checkOut: reserva2CheckOut.toISOString().split('T')[0],
            valorTotal: 2400,
            valorSinal: 800,
            valorRestante: 1600,
            sinalPago: true,
            restantePago: false,
            status: 'confirmada',
            observacoes: 'Reserva corporativa'
        });

        // Reserva ativa - já em andamento
        const reserva3CheckIn = new Date(hoje);
        reserva3CheckIn.setDate(hoje.getDate() - 5);
        const reserva3CheckOut = new Date(reserva3CheckIn);
        reserva3CheckOut.setDate(reserva3CheckIn.getDate() + 30);

        reservas.push({
            clienteId: clientes[3].id,
            apartamentoId: apartamentoIds[2],
            agenteId: null,
            checkIn: reserva3CheckIn.toISOString().split('T')[0],
            checkOut: reserva3CheckOut.toISOString().split('T')[0],
            valorTotal: 2200,
            valorSinal: 2200,
            valorRestante: 0,
            sinalPago: true,
            restantePago: true,
            status: 'confirmada',
            observacoes: 'Estudante - estadia longa'
        });

        // Reserva pendente - pagamento não realizado
        const reserva4CheckIn = new Date(hoje);
        reserva4CheckIn.setDate(hoje.getDate() + 10);
        const reserva4CheckOut = new Date(reserva4CheckIn);
        reserva4CheckOut.setDate(reserva4CheckIn.getDate() + 7);

        reservas.push({
            clienteId: clientes[2].id,
            apartamentoId: apartamentoIds[3],
            agenteId: agentes[0]?.id || null,
            checkIn: reserva4CheckIn.toISOString().split('T')[0],
            checkOut: reserva4CheckOut.toISOString().split('T')[0],
            valorTotal: 950,
            valorSinal: 300,
            valorRestante: 650,
            sinalPago: false,
            restantePago: false,
            status: 'pendente',
            observacoes: 'Aguardando confirmação de pagamento'
        });

        // Reserva futura
        const reserva5CheckIn = new Date(hoje);
        reserva5CheckIn.setDate(hoje.getDate() + 20);
        const reserva5CheckOut = new Date(reserva5CheckIn);
        reserva5CheckOut.setDate(reserva5CheckIn.getDate() + 14);

        reservas.push({
            clienteId: clientes[4].id,
            apartamentoId: apartamentoIds[0],
            agenteId: null,
            checkIn: reserva5CheckIn.toISOString().split('T')[0],
            checkOut: reserva5CheckOut.toISOString().split('T')[0],
            valorTotal: 1700,
            valorSinal: 500,
            valorRestante: 1200,
            sinalPago: true,
            restantePago: false,
            status: 'confirmada',
            observacoes: 'Viagem de negócios'
        });

        return reservas;
    },

    clearAllData() {
        if (storage.clearAllData()) {
            UI.showToast('Todos os dados foram limpos!', 'success');
            if (window.app && window.app.currentModule) {
                window.app.loadModule(window.app.currentModule);
            }
        }
    }
};

// Make available globally
window.SampleDataGenerator = SampleDataGenerator;

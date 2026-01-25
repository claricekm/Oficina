# 📘 Documentação da API - Oficina Automóvel

**Base URL:** `http://localhost:5000/api`
**Autenticação:** Header `Authorization: Bearer <seu_token>`

---

## 🔐 1. Autenticação (`/auth`)
| Método | Endpoint | Acesso | Descrição |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | 🌍 Público | Login (Retorna Token JWT) |
| `POST` | `/auth/register/customer` | 🌍 Público | Registar Cliente |
| `POST` | `/auth/register/admin` | 🌍 Público | Registar Oficina + Admin |
| `POST` | `/auth/register/mechanic` | 🛡️ Admin | Registar Funcionário |

---

## 🏭 2. Oficinas (`/workshops`)
| Método | Endpoint | Acesso | Descrição |
| :--- | :--- | :--- | :--- |
| `GET` | `/workshops` | 🌍 Público | Listar todas as oficinas |
| `GET` | `/workshops/:id` | 🌍 Público | Detalhes de uma oficina |
| `GET` | `/workshops/:id/services` | 🌍 Público | Lista de serviços da oficina |
| `PUT` | `/workshops/:id` | 🛡️ Admin | Atualizar dados da oficina |

---

## 🛠️ 3. Serviços (`/services`)
| Método | Endpoint | Acesso | Descrição |
| :--- | :--- | :--- | :--- |
| `GET` | `/services/workshop/:id` | 🌍 Público | Ver preçário da oficina |
| `GET` | `/services/:id` | 🌍 Público | Detalhes de um serviço |
| `POST` | `/services` | 🛡️ Admin | Criar novo serviço |
| `PUT` | `/services/:id` | 🛡️ Admin | Editar serviço |
| `DELETE` | `/services/:id` | 🛡️ Admin | Remover serviço |

---

## 🚗 4. Veículos (`/vehicles`)

### 🔹 Dados para Dropdowns
| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `GET` | `/vehicles/makes` | Listar marcas |
| `GET` | `/vehicles/makes/:make/models` | Listar modelos |
| `GET` | `/vehicles/fuel-types` | Listar tipos de combustível |

### 🔹 Gestão do Cliente
| Método | Endpoint | Acesso | Descrição |
| :--- | :--- | :--- | :--- |
| `GET` | `/vehicles` | 👤 Customer | Meus veículos |
| `POST` | `/vehicles` | 👤 Customer | Adicionar veículo |
| `PUT` | `/vehicles/:id` | 👤 Customer | Editar veículo |
| `DELETE` | `/vehicles/:id` | 👤 Customer | Apagar veículo |

---

## 📅 5. Agendamentos (`/bookings`)
| Método | Endpoint | Acesso | Descrição |
| :--- | :--- | :--- | :--- |
| `POST` | `/bookings/check-availability` | 🌍 Público | Verificar slots livres |
| `POST` | `/bookings` | 👤 Customer | Criar marcação |
| `GET` | `/bookings` | 🔐 Logado | Listar (Cliente vê os seus, Admin vê todos) |
| `GET` | `/bookings/:id` | 🔐 Logado | Detalhes da marcação |
| `PUT` | `/bookings/:id/cancel` | 🔐 Misto | Cancelar (Cliente ou Admin) |
| `PUT` | `/bookings/:id/status` | 🔧 Staff | Mudar status (ex: Em Progresso) |
| `PUT` | `/bookings/:id/assign` | 🛡️ Admin | Atribuir mecânico |
| `GET` | `/bookings/mechanics-availability`| 🛡️ Admin | Ver carga horária da equipa |

---

## ⏱️ 6. Turnos (`/shifts`)
| Método | Endpoint | Acesso | Descrição |
| :--- | :--- | :--- | :--- |
| `GET` | `/shifts/workshop/:id` | 🌍 Público | Calendário da oficina |
| `GET` | `/shifts/mechanic/:id` | 🔧 Staff | Turnos do mecânico |
| `POST` | `/shifts` | 🛡️ Admin | Criar turno |
| `PUT` | `/shifts/:id` | 🛡️ Admin | Editar turno |
| `DELETE` | `/shifts/:id` | 🛡️ Admin | Apagar turno |

---

## ⭐ 7. Avaliações (`/reviews`)
| Método | Endpoint | Acesso | Descrição |
| :--- | :--- | :--- | :--- |
| `GET` | `/reviews/workshop/:id` | 🌍 Público | Ler avaliações |
| `POST` | `/reviews` | 👤 Customer | Criar avaliação |
| `PUT` | `/reviews/:id/visibility` | 🛡️ Admin | Ocultar/Mostrar comentário |

---

## 📊 8. Estatísticas (`/statistics`)
| Método | Endpoint | Acesso | Descrição |
| :--- | :--- | :--- | :--- |
| `GET` | `/statistics/dashboard` | 🛡️ Admin | KPIs e Gráficos |
| `GET` | `/statistics/mechanics` | 🛡️ Admin | Lista de Mecânicos |
| `DELETE` | `/statistics/mechanics/:id` | 🛡️ Admin | Despedir Mecânico |

---

## 💳 9. Pagamentos (`/payments`)
| Método | Endpoint | Acesso | Descrição |
| :--- | :--- | :--- | :--- |
| `POST` | `/payments/simulate` | 👤 Customer | Simular Pagamento (Dev) |
| `POST` | `/payments/process` | 👤 Customer | Processar Pagamento (Stripe) |
| `GET` | `/payments/:bookingId/status` | 🔐 Logado | Verificar se está pago |

---

## 💶 10. Simulação de Preços (`/simulations`)
| Método | Endpoint | Acesso | Descrição |
| :--- | :--- | :--- | :--- |
| `POST` | `/simulations` | 🔐 Logado | Calcular orçamento |
| `GET` | `/simulations/my` | 👤 Customer | Meus orçamentos |
| `GET` | `/simulations/workshop/:id` | 🛡️ Admin | Ver Leads (orçamentos feitos) |
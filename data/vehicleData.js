/**
 * DADOS ESTÁTICOS DE VEÍCULOS (Static Data Layer)
 * * Contém a lista oficial de Marcas, Modelos e Combustíveis para o mercado português.
 * * Usado para popular os "dropdowns" no Frontend em cascata.
 * * @module data/vehicleData
 */

const vehicleData = {
  makes: [
    {
      name: 'Audi',
      models: [
        { name: 'A1', fuelTypes: ['gasoline', 'diesel'] },
        { name: 'A3', fuelTypes: ['gasoline', 'diesel', 'hybrid'] },
        { name: 'A4', fuelTypes: ['gasoline', 'diesel', 'hybrid'] },
        { name: 'A5', fuelTypes: ['gasoline', 'diesel'] },
        { name: 'A6', fuelTypes: ['gasoline', 'diesel', 'hybrid'] },
        { name: 'Q2', fuelTypes: ['gasoline', 'diesel'] },
        { name: 'Q3', fuelTypes: ['gasoline', 'diesel', 'hybrid'] },
        { name: 'Q5', fuelTypes: ['gasoline', 'diesel', 'hybrid'] },
        { name: 'Q7', fuelTypes: ['gasoline', 'diesel', 'hybrid'] },
        { name: 'e-tron', fuelTypes: ['electric'] }
      ]
    },
    {
      name: 'BMW',
      models: [
        { name: 'Série 1', fuelTypes: ['gasoline', 'diesel'] },
        { name: 'Série 2', fuelTypes: ['gasoline', 'diesel', 'hybrid'] },
        { name: 'Série 3', fuelTypes: ['gasoline', 'diesel', 'hybrid'] },
        { name: 'Série 4', fuelTypes: ['gasoline', 'diesel'] },
        { name: 'Série 5', fuelTypes: ['gasoline', 'diesel', 'hybrid'] },
        { name: 'X1', fuelTypes: ['gasoline', 'diesel', 'hybrid'] },
        { name: 'X3', fuelTypes: ['gasoline', 'diesel', 'hybrid'] },
        { name: 'X5', fuelTypes: ['gasoline', 'diesel', 'hybrid'] },
        { name: 'i3', fuelTypes: ['electric'] },
        { name: 'i4', fuelTypes: ['electric'] },
        { name: 'iX', fuelTypes: ['electric'] }
      ]
    },
    {
      name: 'Citroën',
      models: [
        { name: 'C1', fuelTypes: ['gasoline'] },
        { name: 'C3', fuelTypes: ['gasoline', 'diesel'] },
        { name: 'C3 Aircross', fuelTypes: ['gasoline', 'diesel'] },
        { name: 'C4', fuelTypes: ['gasoline', 'diesel', 'electric'] },
        { name: 'C5 Aircross', fuelTypes: ['gasoline', 'diesel', 'hybrid'] },
        { name: 'Berlingo', fuelTypes: ['gasoline', 'diesel', 'electric'] }
      ]
    },
    {
      name: 'Dacia',
      models: [
        { name: 'Sandero', fuelTypes: ['gasoline', 'lpg'] },
        { name: 'Duster', fuelTypes: ['gasoline', 'diesel', 'lpg'] },
        { name: 'Jogger', fuelTypes: ['gasoline', 'lpg', 'hybrid'] },
        { name: 'Spring', fuelTypes: ['electric'] }
      ]
    },
    {
      name: 'Fiat',
      models: [
        { name: '500', fuelTypes: ['gasoline', 'electric', 'hybrid'] },
        { name: 'Panda', fuelTypes: ['gasoline', 'hybrid', 'lpg'] },
        { name: 'Tipo', fuelTypes: ['gasoline', 'diesel'] },
        { name: '500X', fuelTypes: ['gasoline', 'diesel'] },
        { name: '500L', fuelTypes: ['gasoline', 'diesel'] }
      ]
    },
    {
      name: 'Ford',
      models: [
        { name: 'Fiesta', fuelTypes: ['gasoline', 'diesel'] },
        { name: 'Focus', fuelTypes: ['gasoline', 'diesel', 'hybrid'] },
        { name: 'Puma', fuelTypes: ['gasoline', 'hybrid'] },
        { name: 'Kuga', fuelTypes: ['gasoline', 'diesel', 'hybrid'] },
        { name: 'Mustang Mach-E', fuelTypes: ['electric'] },
        { name: 'Transit', fuelTypes: ['diesel'] }
      ]
    },
    {
      name: 'Honda',
      models: [
        { name: 'Jazz', fuelTypes: ['hybrid'] },
        { name: 'Civic', fuelTypes: ['gasoline', 'hybrid'] },
        { name: 'HR-V', fuelTypes: ['hybrid'] },
        { name: 'CR-V', fuelTypes: ['hybrid'] },
        { name: 'e', fuelTypes: ['electric'] }
      ]
    },
    {
      name: 'Hyundai',
      models: [
        { name: 'i10', fuelTypes: ['gasoline'] },
        { name: 'i20', fuelTypes: ['gasoline'] },
        { name: 'i30', fuelTypes: ['gasoline', 'diesel'] },
        { name: 'Tucson', fuelTypes: ['gasoline', 'diesel', 'hybrid'] },
        { name: 'Kona', fuelTypes: ['gasoline', 'hybrid', 'electric'] },
        { name: 'IONIQ 5', fuelTypes: ['electric'] },
        { name: 'IONIQ 6', fuelTypes: ['electric'] }
      ]
    },
    {
      name: 'Kia',
      models: [
        { name: 'Picanto', fuelTypes: ['gasoline'] },
        { name: 'Rio', fuelTypes: ['gasoline'] },
        { name: 'Ceed', fuelTypes: ['gasoline', 'diesel'] },
        { name: 'Sportage', fuelTypes: ['gasoline', 'diesel', 'hybrid'] },
        { name: 'Niro', fuelTypes: ['hybrid', 'electric'] },
        { name: 'EV6', fuelTypes: ['electric'] }
      ]
    },
    {
      name: 'Mercedes-Benz',
      models: [
        { name: 'Classe A', fuelTypes: ['gasoline', 'diesel', 'hybrid'] },
        { name: 'Classe B', fuelTypes: ['gasoline', 'diesel'] },
        { name: 'Classe C', fuelTypes: ['gasoline', 'diesel', 'hybrid'] },
        { name: 'Classe E', fuelTypes: ['gasoline', 'diesel', 'hybrid'] },
        { name: 'GLA', fuelTypes: ['gasoline', 'diesel', 'hybrid'] },
        { name: 'GLC', fuelTypes: ['gasoline', 'diesel', 'hybrid'] },
        { name: 'GLE', fuelTypes: ['gasoline', 'diesel', 'hybrid'] },
        { name: 'EQA', fuelTypes: ['electric'] },
        { name: 'EQB', fuelTypes: ['electric'] },
        { name: 'EQC', fuelTypes: ['electric'] }
      ]
    },
    {
      name: 'Nissan',
      models: [
        { name: 'Micra', fuelTypes: ['gasoline'] },
        { name: 'Juke', fuelTypes: ['gasoline', 'hybrid'] },
        { name: 'Qashqai', fuelTypes: ['gasoline', 'hybrid'] },
        { name: 'X-Trail', fuelTypes: ['hybrid'] },
        { name: 'Leaf', fuelTypes: ['electric'] },
        { name: 'Ariya', fuelTypes: ['electric'] }
      ]
    },
    {
      name: 'Opel',
      models: [
        { name: 'Corsa', fuelTypes: ['gasoline', 'diesel', 'electric'] },
        { name: 'Astra', fuelTypes: ['gasoline', 'diesel', 'hybrid'] },
        { name: 'Crossland', fuelTypes: ['gasoline', 'diesel'] },
        { name: 'Grandland', fuelTypes: ['gasoline', 'diesel', 'hybrid'] },
        { name: 'Mokka', fuelTypes: ['gasoline', 'diesel', 'electric'] }
      ]
    },
    {
      name: 'Peugeot',
      models: [
        { name: '208', fuelTypes: ['gasoline', 'diesel', 'electric'] },
        { name: '308', fuelTypes: ['gasoline', 'diesel', 'hybrid'] },
        { name: '2008', fuelTypes: ['gasoline', 'diesel', 'electric'] },
        { name: '3008', fuelTypes: ['gasoline', 'diesel', 'hybrid'] },
        { name: '5008', fuelTypes: ['gasoline', 'diesel', 'hybrid'] },
        { name: 'Partner', fuelTypes: ['diesel', 'electric'] }
      ]
    },
    {
      name: 'Renault',
      models: [
        { name: 'Clio', fuelTypes: ['gasoline', 'lpg', 'hybrid'] },
        { name: 'Captur', fuelTypes: ['gasoline', 'lpg', 'hybrid'] },
        { name: 'Mégane', fuelTypes: ['gasoline', 'diesel', 'electric'] },
        { name: 'Arkana', fuelTypes: ['hybrid'] },
        { name: 'Scenic', fuelTypes: ['electric'] },
        { name: 'ZOE', fuelTypes: ['electric'] },
        { name: 'Kangoo', fuelTypes: ['diesel', 'electric'] }
      ]
    },
    {
      name: 'Seat',
      models: [
        { name: 'Ibiza', fuelTypes: ['gasoline'] },
        { name: 'Leon', fuelTypes: ['gasoline', 'diesel', 'hybrid'] },
        { name: 'Arona', fuelTypes: ['gasoline'] },
        { name: 'Ateca', fuelTypes: ['gasoline', 'diesel'] },
        { name: 'Tarraco', fuelTypes: ['gasoline', 'diesel', 'hybrid'] }
      ]
    },
    {
      name: 'Škoda',
      models: [
        { name: 'Fabia', fuelTypes: ['gasoline'] },
        { name: 'Scala', fuelTypes: ['gasoline'] },
        { name: 'Octavia', fuelTypes: ['gasoline', 'diesel', 'hybrid'] },
        { name: 'Kamiq', fuelTypes: ['gasoline'] },
        { name: 'Karoq', fuelTypes: ['gasoline', 'diesel'] },
        { name: 'Kodiaq', fuelTypes: ['gasoline', 'diesel'] },
        { name: 'Enyaq', fuelTypes: ['electric'] }
      ]
    },
    {
      name: 'Tesla',
      models: [
        { name: 'Model 3', fuelTypes: ['electric'] },
        { name: 'Model Y', fuelTypes: ['electric'] },
        { name: 'Model S', fuelTypes: ['electric'] },
        { name: 'Model X', fuelTypes: ['electric'] }
      ]
    },
    {
      name: 'Toyota',
      models: [
        { name: 'Yaris', fuelTypes: ['gasoline', 'hybrid'] },
        { name: 'Yaris Cross', fuelTypes: ['hybrid'] },
        { name: 'Corolla', fuelTypes: ['hybrid'] },
        { name: 'C-HR', fuelTypes: ['hybrid'] },
        { name: 'RAV4', fuelTypes: ['hybrid'] },
        { name: 'Prius', fuelTypes: ['hybrid'] },
        { name: 'bZ4X', fuelTypes: ['electric'] },
        { name: 'Land Cruiser', fuelTypes: ['diesel'] }
      ]
    },
    {
      name: 'Volkswagen',
      models: [
        { name: 'Polo', fuelTypes: ['gasoline'] },
        { name: 'Golf', fuelTypes: ['gasoline', 'diesel', 'hybrid'] },
        { name: 'T-Cross', fuelTypes: ['gasoline'] },
        { name: 'T-Roc', fuelTypes: ['gasoline', 'diesel'] },
        { name: 'Tiguan', fuelTypes: ['gasoline', 'diesel', 'hybrid'] },
        { name: 'Passat', fuelTypes: ['gasoline', 'diesel', 'hybrid'] },
        { name: 'ID.3', fuelTypes: ['electric'] },
        { name: 'ID.4', fuelTypes: ['electric'] },
        { name: 'ID.5', fuelTypes: ['electric'] },
        { name: 'Caddy', fuelTypes: ['diesel'] }
      ]
    },
    {
      name: 'Volvo',
      models: [
        { name: 'XC40', fuelTypes: ['gasoline', 'hybrid', 'electric'] },
        { name: 'XC60', fuelTypes: ['gasoline', 'diesel', 'hybrid'] },
        { name: 'XC90', fuelTypes: ['diesel', 'hybrid'] },
        { name: 'V60', fuelTypes: ['diesel', 'hybrid'] },
        { name: 'S60', fuelTypes: ['hybrid'] },
        { name: 'C40', fuelTypes: ['electric'] },
        { name: 'EX30', fuelTypes: ['electric'] }
      ]
    }
  ],
  fuelTypes: [
    { code: 'gasoline', label: 'Gasolina' },
    { code: 'diesel', label: 'Gasóleo' },
    { code: 'electric', label: 'Elétrico' },
    { code: 'hybrid', label: 'Híbrido' },
    { code: 'lpg', label: 'GPL' }
  ]
};

/**
 * OBTER TODAS AS MARCAS
 * * Retorna um array com os nomes das marcas ordenados alfabeticamente.
 * * @returns Array de strings
 */
const getMakes = () => {
  return vehicleData.makes.map(make => make.name).sort();
};

/**
 * OBTER MODELOS POR MARCA
 * * Procura a marca e retorna a lista de modelos disponíveis.
 * * @param makeName - O nome da marca (ex: 'BMW')
 * * @returns Array de strings com nomes dos modelos
 */
const getModels = (makeName) => {
  const make = vehicleData.makes.find(
    m => m.name.toLowerCase() === makeName.toLowerCase()
  );
  if (!make) return [];
  return make.models.map(model => model.name).sort();
};

/**
 * OBTER COMBUSTÍVEIS POR MODELO
 * * Retorna apenas os combustíveis compatíveis com aquele carro específico.
 * * Ex: Se escolher 'Tesla', só devolve 'Elétrico'.
 * * @param makeName - Nome da marca
 * * @param modelName - Nome do modelo
 * * @returns Array de objetos com code e label
 */
const getFuelTypesForModel = (makeName, modelName) => {
  const make = vehicleData.makes.find(
    m => m.name.toLowerCase() === makeName.toLowerCase()
  );
  if (!make) return [];

  const model = make.models.find(
    m => m.name.toLowerCase() === modelName.toLowerCase()
  );
  if (!model) return [];

  // Mapeia os códigos de combustível para os objetos completos (com label)
  return model.fuelTypes.map(fuelCode => {
    const fuelType = vehicleData.fuelTypes.find(f => f.code === fuelCode);
    return fuelType || { code: fuelCode, label: fuelCode };
  });
};

/**
 * OBTER TODOS OS COMBUSTÍVEIS
 * * Retorna a lista mestre de combustíveis para listagens gerais.
 */
const getAllFuelTypes = () => {
  return vehicleData.fuelTypes;
};

module.exports = {
  vehicleData,
  getMakes,
  getModels,
  getFuelTypesForModel,
  getAllFuelTypes
};
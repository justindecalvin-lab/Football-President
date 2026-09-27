import { Club, Player, RivalAgent, Position, SportingDirectorProfile, BoardOfDirectorsState, BoardMember, BoardMandate } from '../types';
import { INITIAL_CLUBS, INITIAL_PLAYERS } from '../data/mockData';

export interface LeagueDef {
  id: string;
  name: string;
  country: string;
  flag: string;
  continent: 'Europe' | 'South America' | 'North America' | 'Asia' | 'Africa';
  tier: number; // 1 = Top Tier, 2 = Second Tier Relegation League
  coefficient: number; // UEFA/Continental coefficient
  nativeCountry: string;
}

export const CONTINENTAL_LEAGUES: LeagueDef[] = [
  // EUROPE (5 Countries x 2 Leagues = 10 European Leagues with UEFA Coefficients)
  { id: 'eng_pl', name: 'Premier League', country: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', continent: 'Europe', tier: 1, coefficient: 104.2, nativeCountry: 'England' },
  { id: 'eng_ch', name: 'EFL Championship', country: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', continent: 'Europe', tier: 2, coefficient: 45.0, nativeCountry: 'England' },
  { id: 'esp_ll', name: 'La Liga', country: 'Spain', flag: '🇪🇸', continent: 'Europe', tier: 1, coefficient: 89.6, nativeCountry: 'Spain' },
  { id: 'esp_l2', name: 'La Liga 2', country: 'Spain', flag: '🇪🇸', continent: 'Europe', tier: 2, coefficient: 38.5, nativeCountry: 'Spain' },
  { id: 'ita_sa', name: 'Serie A', country: 'Italy', flag: '🇮🇹', continent: 'Europe', tier: 1, coefficient: 88.1, nativeCountry: 'Italy' },
  { id: 'ita_sb', name: 'Serie B', country: 'Italy', flag: '🇮🇹', continent: 'Europe', tier: 2, coefficient: 36.2, nativeCountry: 'Italy' },
  { id: 'ger_bl', name: 'Bundesliga', country: 'Germany', flag: '🇩🇪', continent: 'Europe', tier: 1, coefficient: 86.4, nativeCountry: 'Germany' },
  { id: 'ger_b2', name: '2. Bundesliga', country: 'Germany', flag: '🇩🇪', continent: 'Europe', tier: 2, coefficient: 35.8, nativeCountry: 'Germany' },
  { id: 'fra_l1', name: 'Ligue 1', country: 'France', flag: '🇫🇷', continent: 'Europe', tier: 1, coefficient: 66.8, nativeCountry: 'France' },
  { id: 'fra_l2', name: 'Ligue 2', country: 'France', flag: '🇫🇷', continent: 'Europe', tier: 2, coefficient: 28.4, nativeCountry: 'France' },

  // SOUTH AMERICA (5 Leagues)
  { id: 'bra_sa', name: 'Brasileirão Série A', country: 'Brazil', flag: '🇧🇷', continent: 'South America', tier: 1, coefficient: 78.5, nativeCountry: 'Brazil' },
  { id: 'arg_pd', name: 'Argentine Primera', country: 'Argentina', flag: '🇦🇷', continent: 'South America', tier: 1, coefficient: 72.0, nativeCountry: 'Argentina' },
  { id: 'col_pa', name: 'Colombian Primera A', country: 'Colombia', flag: '🇨🇴', continent: 'South America', tier: 2, coefficient: 42.1, nativeCountry: 'Colombia' },
  { id: 'chi_pd', name: 'Chilean Primera', country: 'Chile', flag: '🇨🇱', continent: 'South America', tier: 2, coefficient: 39.8, nativeCountry: 'Chile' },
  { id: 'uru_pd', name: 'Uruguayan Primera', country: 'Uruguay', flag: '🇺🇾', continent: 'South America', tier: 2, coefficient: 38.0, nativeCountry: 'Uruguay' },

  // NORTH AMERICA (5 Leagues)
  { id: 'usa_mls', name: 'Major League Soccer', country: 'USA & Canada', flag: '🇺🇸', continent: 'North America', tier: 1, coefficient: 62.4, nativeCountry: 'USA' },
  { id: 'mex_lmx', name: 'Liga MX', country: 'Mexico', flag: '🇲🇽', continent: 'North America', tier: 1, coefficient: 64.0, nativeCountry: 'Mexico' },
  { id: 'usa_usl', name: 'USL Championship', country: 'USA', flag: '🇺🇸', continent: 'North America', tier: 2, coefficient: 28.0, nativeCountry: 'USA' },
  { id: 'can_cpl', name: 'Canadian Premier League', country: 'Canada', flag: '🇨🇦', continent: 'North America', tier: 2, coefficient: 24.5, nativeCountry: 'Canada' },
  { id: 'crc_pd', name: 'Costa Rican Primera', country: 'Costa Rica', flag: '🇨🇷', continent: 'North America', tier: 2, coefficient: 26.2, nativeCountry: 'Costa Rica' },

  // ASIA (5 Leagues)
  { id: 'sau_spl', name: 'Saudi Pro League', country: 'Saudi Arabia', flag: '🇸🇦', continent: 'Asia', tier: 1, coefficient: 71.2, nativeCountry: 'Saudi Arabia' },
  { id: 'jpn_j1', name: 'J1 League', country: 'Japan', flag: '🇯🇵', continent: 'Asia', tier: 1, coefficient: 58.0, nativeCountry: 'Japan' },
  { id: 'kor_k1', name: 'K League 1', country: 'South Korea', flag: '🇰🇷', continent: 'Asia', tier: 1, coefficient: 54.5, nativeCountry: 'South Korea' },
  { id: 'qat_qsl', name: 'Qatar Stars League', country: 'Qatar', flag: '🇶🇦', continent: 'Asia', tier: 1, coefficient: 49.0, nativeCountry: 'Qatar' },
  { id: 'uae_upl', name: 'UAE Pro League', country: 'UAE', flag: '🇦🇪', continent: 'Asia', tier: 1, coefficient: 46.8, nativeCountry: 'UAE' },

  // AFRICA (5 Leagues)
  { id: 'egy_epl', name: 'Egyptian Premier League', country: 'Egypt', flag: '🇪🇬', continent: 'Africa', tier: 1, coefficient: 55.0, nativeCountry: 'Egypt' },
  { id: 'mar_bot', name: 'Moroccan Botola Pro', country: 'Morocco', flag: '🇲🇦', continent: 'Africa', tier: 1, coefficient: 52.4, nativeCountry: 'Morocco' },
  { id: 'rsa_psl', name: 'South African PSL', country: 'South Africa', flag: '🇿🇦', continent: 'Africa', tier: 1, coefficient: 48.0, nativeCountry: 'South Africa' },
  { id: 'tun_lp1', name: 'Tunisian Ligue 1', country: 'Tunisia', flag: '🇹🇳', continent: 'Africa', tier: 2, coefficient: 35.1, nativeCountry: 'Tunisia' },
  { id: 'nga_npfl', name: 'Nigerian NPFL', country: 'Nigeria', flag: '🇳🇬', continent: 'Africa', tier: 2, coefficient: 32.8, nativeCountry: 'Nigeria' }
];

export function assignPotentialVolatilityAndRealization(
  age: number,
  rating: number,
  theoreticalPotential: number
): {
  volatility: 'stable' | 'volatile' | 'boom_or_bust' | 'late_bloomer' | 'early_peaker';
  realizationChance: number;
  actualPotentialLimit: number;
  realizationRate: number;
} {
  if (age > 25) {
    return {
      volatility: 'stable',
      realizationChance: 0.90,
      actualPotentialLimit: rating,
      realizationRate: 0.95
    };
  }

  const roll = Math.random();
  let volatility: 'stable' | 'volatile' | 'boom_or_bust' | 'late_bloomer' | 'early_peaker';
  let realizationChance: number;
  let realizationRate: number;

  if (roll < 0.45) {
    volatility = 'stable';
    realizationChance = Number((0.70 + Math.random() * 0.22).toFixed(2)); // 0.70 - 0.92
    realizationRate = Number((0.85 + Math.random() * 0.20).toFixed(2));
  } else if (roll < 0.70) {
    volatility = 'volatile';
    realizationChance = Number((0.45 + Math.random() * 0.30).toFixed(2)); // 0.45 - 0.75
    realizationRate = Number((0.75 + Math.random() * 0.35).toFixed(2));
  } else if (roll < 0.85) {
    volatility = 'boom_or_bust';
    realizationChance = Number((0.25 + Math.random() * 0.35).toFixed(2)); // 0.25 - 0.60 (High risk of bust!)
    realizationRate = Number((0.65 + Math.random() * 0.45).toFixed(2));
  } else if (roll < 0.95) {
    volatility = 'late_bloomer';
    realizationChance = Number((0.60 + Math.random() * 0.30).toFixed(2)); // 0.60 - 0.90
    realizationRate = Number((0.60 + Math.random() * 0.25).toFixed(2));
  } else {
    volatility = 'early_peaker';
    realizationChance = Number((0.75 + Math.random() * 0.20).toFixed(2)); // 0.75 - 0.95
    realizationRate = Number((1.05 + Math.random() * 0.20).toFixed(2));
  }

  // Ensure high potential does NOT guarantee elite status!
  const potentialGap = Math.max(0, theoreticalPotential - rating);
  const actualPotentialLimit = Math.max(rating, rating + Math.round(potentialGap * realizationChance));

  return {
    volatility,
    realizationChance,
    actualPotentialLimit,
    realizationRate
  };
}

export function calculateValuationForRating(rating: number, age: number, potential: number = rating): number {
  const baseValue = Math.pow(rating / 50, 4.2) * 2200000;
  const youthMultiplier = age <= 21 ? 1.45 : age <= 24 ? 1.25 : age <= 28 ? 1.0 : age <= 31 ? 0.75 : 0.45;
  const potentialBoost = (potential - rating) > 0 ? (potential - rating) * 0.04 : 0;
  return Math.round(baseValue * youthMultiplier * (1 + potentialBoost));
}

// -------------------------------------------------------------
// AUTHENTIC REGIONAL NAMES & NATIONALITIES DATABASE
// -------------------------------------------------------------
interface CountryData {
  nationality: string;
  flag: string;
  firstNames: string[];
  lastNames: string[];
}

const REGIONAL_NAMES: Record<string, CountryData> = {
  England: {
    nationality: 'England',
    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    firstNames: ['Harry', 'Jack', 'Oliver', 'Charlie', 'Declan', 'Marcus', 'Mason', 'Jude', 'Bukayo', 'Cole', 'Trent', 'Phil', 'Jordan', 'Ben', 'Reece', 'Archie', 'Lewis', 'Harvey', 'Morgan', 'Callum'],
    lastNames: ['Smith', 'Taylor', 'Walker', 'Bellingham', 'Saka', 'Palmer', 'Rice', 'Foden', 'Alexander-Arnold', 'Kane', 'Stones', 'Pickford', 'Grealish', 'Gordon', 'Mainoo', 'Wharton', 'Colwill', 'Lewis', 'Maddison', 'Trippier']
  },
  Spain: {
    nationality: 'Spain',
    flag: '🇪🇸',
    firstNames: ['Mateo', 'Santiago', 'Alejandro', 'Alvaro', 'Sergio', 'Lucas', 'Daniel', 'Pablo', 'Rodri', 'Lamine', 'Pedri', 'Gavi', 'Ferran', 'Nico', 'Mikel', 'Dani', 'Pau', 'Marc', 'David', 'Unai'],
    lastNames: ['Garcia', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Ruiz', 'Yamal', 'Williams', 'Torres', 'Olmo', 'Merino', 'Zubimendi', 'Cubarsi', 'Carvajal', 'Simon', 'Baena', 'Navas', 'Morata', 'Pino']
  },
  Italy: {
    nationality: 'Italy',
    flag: '🇮🇹',
    firstNames: ['Lorenzo', 'Leonardo', 'Francesco', 'Alessandro', 'Matteo', 'Federico', 'Gianluigi', 'Nicolo', 'Giacomo', 'Davide', 'Manuel', 'Riccardo', 'Giorgio', 'Andrea', 'Samuele', 'Moise', 'Mateo', 'Gianluca', 'Bryan', 'Sandro'],
    lastNames: ['Rossi', 'Ferrari', 'Bianchi', 'Esposito', 'Romano', 'Colombo', 'Donnarumma', 'Barella', 'Bastoni', 'Chiesa', 'Dimarco', 'Calafiori', 'Tonali', 'Scamacca', 'Retegui', 'Frattesi', 'Pellegrini', 'Locatelli', 'Buongiorno', 'Vicario']
  },
  Germany: {
    nationality: 'Germany',
    flag: '🇩🇪',
    firstNames: ['Lukas', 'Maximilian', 'Jonas', 'Felix', 'Niklas', 'Florian', 'Jamal', 'Kai', 'Leroy', 'Joshua', 'Toni', 'Antonio', 'Manuel', 'Leon', 'Nico', 'Julian', 'Robert', 'Waldemar', 'Deniz', 'Aleksandar'],
    lastNames: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Musiala', 'Wirtz', 'Havertz', 'Sane', 'Kimmich', 'Rüdiger', 'Neuer', 'Goretzka', 'Schlotterbeck', 'Andrich', 'Tah', 'Undav', 'Pavlovic', 'Fuhrich', 'Mittelstadt']
  },
  France: {
    nationality: 'France',
    flag: '🇫🇷',
    firstNames: ['Antoine', 'Kylian', 'Theo', 'Aurelien', 'Eduardo', 'Ousmane', 'William', 'Bradley', 'Michael', 'Warren', 'Dayot', 'Jules', 'Ibrahima', 'Randal', 'Marcus', 'Adrien', 'Brice', 'Manu', 'Rayan', 'Kingsley'],
    lastNames: ['Dubois', 'Laurent', 'Moreau', 'Mbappe', 'Hernandez', 'Tchouameni', 'Camavinga', 'Dembele', 'Saliba', 'Barcola', 'Olise', 'Zaire-Emery', 'Upamecano', 'Kounde', 'Konate', 'Kolo Muani', 'Thuram', 'Rabiot', 'Samba', 'Kone']
  },
  Brazil: {
    nationality: 'Brazil',
    flag: '🇧🇷',
    firstNames: ['Gabriel', 'Matheus', 'Lucas', 'Thiago', 'Rodrigo', 'Vinicius', 'Rodrygo', 'Endrick', 'Raphinha', 'Bruno', 'Douglas', 'Alisson', 'Ederson', 'Marquinhos', 'Eder', 'Savinho', 'Estevao', 'Paqueta', 'Richarlison', 'Casemiro'],
    lastNames: ['Silva', 'Santos', 'Oliveira', 'Souza', 'Pereira', 'Lima', 'Junior', 'Goes', 'Felipe', 'Guimaraes', 'Luiz', 'Becker', 'Moraes', 'Militao', 'Moreira', 'Willian', 'Paqueta', 'Andrade', 'Costa', 'Ribeiro']
  },
  Argentina: {
    nationality: 'Argentina',
    flag: '🇦🇷',
    firstNames: ['Julian', 'Lautaro', 'Rodrigo', 'Enzo', 'Alexis', 'Cristian', 'Emiliano', 'Nahuel', 'Lisandro', 'Alejandro', 'Valentin', 'Nicolas', 'Exequiel', 'Giovani', 'Thiago', 'Facundo', 'Claudio', 'Franco', 'Lucas', 'Leandro'],
    lastNames: ['Alvarez', 'Martinez', 'De Paul', 'Fernandez', 'Mac Allister', 'Romero', 'Molina', 'Garnacho', 'Barco', 'Gonzalez', 'Palacios', 'Lo Celso', 'Almada', 'Carboni', 'Echeverri', 'Paredes', 'Otamendi', 'Tagliafico', 'Montiel', 'Pezzella']
  },
  Colombia: {
    nationality: 'Colombia',
    flag: '🇨🇴',
    firstNames: ['Luis', 'James', 'Jhon', 'Richard', 'Daniel', 'Davinson', 'Jefferson', 'Camilo', 'Yerry', 'Mateus', 'Jorge', 'Jhonny', 'Kevin', 'Yaser', 'Carlos', 'Santiago', 'Rafael', 'Jhonatan', 'David', 'Brayan'],
    lastNames: ['Diaz', 'Rodriguez', 'Arias', 'Rios', 'Munoz', 'Sanchez', 'Lerma', 'Vargas', 'Mina', 'Uribe', 'Carrascal', 'Lucumi', 'Castano', 'Asprilla', 'Cuesta', 'Borre', 'Duran', 'Sinisterra', 'Mojica', 'Ospina']
  },
  Chile: {
    nationality: 'Chile',
    flag: '🇨🇱',
    firstNames: ['Alexis', 'Arturo', 'Gary', 'Ben', 'Erick', 'Marcelino', 'Gabriel', 'Paulo', 'Diego', 'Brayan', 'Vicente', 'Dario', 'Alexander', 'Victor', 'Guillermo', 'Lucas', 'Cesar', 'Felipe', 'Mauricio', 'Thomas'],
    lastNames: ['Sanchez', 'Vidal', 'Medel', 'Brereton', 'Pulgar', 'Nunez', 'Suazo', 'Diaz', 'Valdes', 'Cortes', 'Pizarro', 'Osorio', 'Aravena', 'Mendez', 'Maripan', 'Cepeda', 'Perez', 'Loyola', 'Isla', 'Galdames']
  },
  Uruguay: {
    nationality: 'Uruguay',
    flag: '🇺🇾',
    firstNames: ['Federico', 'Darwin', 'Ronald', 'Manuel', 'Rodrigo', 'Sergio', 'Facundo', 'Mathias', 'Sebastian', 'Nicolas', 'Guillermo', 'Nahitan', 'Jose', 'Brian', 'Emiliano', 'Luciano', 'Giorgian', 'Matias', 'Lucas', 'Alfonso'],
    lastNames: ['Valverde', 'Nunez', 'Araujo', 'Ugarte', 'Bentancur', 'Rochet', 'Pellistri', 'Olivera', 'Caceres', 'De la Cruz', 'Varela', 'Nandez', 'Gimenez', 'Rodriguez', 'Martinez', 'Rodriguez', 'De Arrascaeta', 'Vina', 'Torreira', 'Espino']
  },
  USA: {
    nationality: 'USA',
    flag: '🇺🇸',
    firstNames: ['Christian', 'Weston', 'Tyler', 'Brenden', 'Folarin', 'Timothy', 'Antonee', 'Sergino', 'Chris', 'Matt', 'Johnny', 'Malik', 'Mark', 'Ricardo', 'Josh', 'Gio', 'Miles', 'Joe', 'Cade', 'Aidan'],
    lastNames: ['Pulisic', 'McKennie', 'Adams', 'Aaronson', 'Balogun', 'Weah', 'Robinson', 'Dest', 'Richards', 'Turner', 'Cardoso', 'Tillman', 'McKenzie', 'Pepi', 'Sargent', 'Reyna', 'Robinson', 'Scally', 'Cowell', 'Morris']
  },
  Canada: {
    nationality: 'Canada',
    flag: '🇨🇦',
    firstNames: ['Alphonso', 'Jonathan', 'Stephen', 'Tajon', 'Ismael', 'Moise', 'Derek', 'Alistair', 'Maxime', 'Dayne', 'Richie', 'Kamal', 'Samuel', 'Liam', 'Jacob', 'Mathieu', 'Ali', 'Nathan', 'Thelonius', 'Luka'],
    lastNames: ['Davies', 'David', 'Eustaquio', 'Buchanan', 'Kone', 'Bombito', 'Cornelius', 'Johnston', 'Crepeau', 'St. Clair', 'Laryea', 'Miller', 'Piette', 'Millar', 'Shaffelburg', 'Choiniere', 'Ahmed', 'Saliba', 'Bair', 'Koleosho']
  },
  Mexico: {
    nationality: 'Mexico',
    flag: '🇲🇽',
    firstNames: ['Santiago', 'Edson', 'Hirving', 'Cesar', 'Luis', 'Johan', 'Orbelin', 'Luis', 'Uriel', 'Alexis', 'Guillermo', 'Julian', 'Erick', 'Jesus', 'Marcelo', 'Roberto', 'Carlos', 'Diego', 'Jorge', 'Raul'],
    lastNames: ['Gimenez', 'Alvarez', 'Lozano', 'Montes', 'Chavez', 'Vasquez', 'Pineda', 'Romo', 'Antuna', 'Vega', 'Ochoa', 'Quinones', 'Sanchez', 'Gallardo', 'Flores', 'Alvarado', 'Rodriguez', 'Lainez', 'Sanchez', 'Jimenez']
  },
  CostaRica: {
    nationality: 'Costa Rica',
    flag: '🇨🇷',
    firstNames: ['Keylor', 'Manfred', 'Joel', 'Francisco', 'Juan', 'Jeyland', 'Brandon', 'Alvaro', 'Warren', 'Patrick', 'Gerald', 'Jefferson', 'Anthony', 'Josimar', 'Haxzel', 'Alejandro', 'Andy', 'Julio', 'Kenneth', 'Orlando'],
    lastNames: ['Navas', 'Ugalde', 'Campbell', 'Calvo', 'Vargas', 'Mitchell', 'Aguilera', 'Zamora', 'Madrigal', 'Sequeira', 'Taylor', 'Brenes', 'Contreras', 'Alcocer', 'Quiros', 'Bran', 'Rojas', 'Cascante', 'Vargas', 'Galo']
  },
  SaudiArabia: {
    nationality: 'Saudi Arabia',
    flag: '🇸🇦',
    firstNames: ['Salem', 'Firas', 'Saleh', 'Saud', 'Ali', 'Hassan', 'Sultan', 'Abdulelah', 'Nasser', 'Ayman', 'Fawaz', 'Musab', 'Mohammed', 'Abdullah', 'Abdulrahman', 'Faisal', 'Ziyad', 'Rayan', 'Moteb', 'Turki'],
    lastNames: ['Al-Dawsari', 'Al-Buraikan', 'Al-Shehri', 'Abdulhamid', 'Al-Bulayhi', 'Kadesh', 'Al-Ghannam', 'Al-Malki', 'Al-Dawsari', 'Yahya', 'Al-Qarni', 'Al-Juwayr', 'Kanno', 'Al-Khaibari', 'Ghareeb', 'Al-Ghamdi', 'Al-Sahafi', 'Hamed', 'Al-Harbi', 'Al-Ammar']
  },
  Japan: {
    nationality: 'Japan',
    flag: '🇯🇵',
    firstNames: ['Kaoru', 'Takefusa', 'Daichi', 'Takumi', 'Wataru', 'Hiroki', 'Takehiro', 'Koki', 'Ayase', 'Ritsu', 'Hidemasa', 'Ao', 'Yukinari', 'Zion', 'Keito', 'Kosei', 'Shogo', 'Daizen', 'Reo', 'Kota'],
    lastNames: ['Mitoma', 'Kubo', 'Kamada', 'Minamino', 'Endo', 'Ito', 'Tomiyasu', 'Machida', 'Ueda', 'Doan', 'Morita', 'Tanaka', 'Sugawara', 'Suzuki', 'Nakamura', 'Tani', 'Taniguchi', 'Maeda', 'Hatate', 'Takai']
  },
  SouthKorea: {
    nationality: 'South Korea',
    flag: '🇰🇷',
    firstNames: ['Heung-min', 'Min-jae', 'Kang-in', 'Hee-chan', 'In-beom', 'Jae-sung', 'Hyun-seok', 'Young-woo', 'Seung-ho', 'Gue-sung', 'Hyun-woo', 'Bum-keun', 'Min-hyeok', 'Jun-ho', 'Han-beom', 'Jin-seob', 'Won-sang', 'Sang-bin', 'Young-gwon', 'Jin-su'],
    lastNames: ['Son', 'Kim', 'Lee', 'Hwang', 'Hwang', 'Lee', 'Hong', 'Seol', 'Paik', 'Cho', 'Jo', 'Song', 'Yang', 'Bae', 'Lee', 'Park', 'Um', 'Jeong', 'Kim', 'Kim']
  },
  Qatar: {
    nationality: 'Qatar',
    flag: '🇶🇦',
    firstNames: ['Akram', 'Almoez', 'Hassan', 'Bassam', 'Tarek', 'Boualem', 'Homam', 'Meshaal', 'Mohammed', 'Jassim', 'Ahmed', 'Youssef', 'Sultan', 'Mostafa', 'Assim', 'Hazem', 'Ismaeel', 'Salah', 'Naif', 'Saad'],
    lastNames: ['Afif', 'Ali', 'Al-Haydos', 'Al-Rawi', 'Salman', 'Khoukhi', 'Ahmed', 'Barsham', 'Waad', 'Gaber', 'Fatehi', 'Ayman', 'Al-Brake', 'Meshaal', 'Madibo', 'Shehata', 'Mohammad', 'Zakaria', 'Al-Hadhrami', 'Al-Sheeb']
  },
  UAE: {
    nationality: 'UAE',
    flag: '🇦🇪',
    firstNames: ['Ali', 'Caio', 'Fabio', 'Khalid', 'Harib', 'Yahia', 'Majed', 'Tahnoon', 'Bader', 'Zayed', 'Ali', 'Khalifa', 'Abdullah', 'Mohammed', 'Sultan', 'Yousef', 'Kouame', 'Marcus', 'Gaston', 'Luan'],
    lastNames: ['Mabkhout', 'Canedo', 'Lima', 'Eisa', 'Abdalla', 'Nader', 'Hassan', 'Al-Zaabi', 'Nasser', 'Sultan', 'Saleh', 'Al-Hammadi', 'Idrees', 'Al-Attas', 'Adil', 'Jaber', 'Autonne', 'Meloni', 'Alvarez', 'Pereira']
  },
  Egypt: {
    nationality: 'Egypt',
    flag: '🇪🇬',
    firstNames: ['Mohamed', 'Omar', 'Mahmoud', 'Mostafa', 'Ahmed', 'Emam', 'Marwan', 'Mohamed', 'Ahmed', 'Hamdy', 'Zizo', 'Yasser', 'Mohamed', 'Akram', 'Ahmed', 'Mohamed', 'Nasser', 'Ibrahim', 'Taher', 'Mostafa'],
    lastNames: ['Salah', 'Marmoush', 'Trezeguet', 'Mohamed', 'Sayed', 'Ashour', 'Attia', 'Abdelmonem', 'Fetouh', 'Fathy', 'El-Sayed', 'Ibrahim', 'El-Shenawy', 'Tawfik', 'Koka', 'Sobhi', 'Maher', 'Adel', 'Mohamed', 'Shobeir']
  },
  Morocco: {
    nationality: 'Morocco',
    flag: '🇲🇦',
    firstNames: ['Achraf', 'Brahim', 'Hakim', 'Youssef', 'Sofyan', 'Azzedine', 'Yassine', 'Nayef', 'Noussair', 'Amine', 'Bilal', 'Ismael', 'Eliesse', 'Ilias', 'Abde', 'Amir', 'Munir', 'Chadi', 'Zakaria', 'Ayoub'],
    lastNames: ['Hakimi', 'Diaz', 'Ziyech', 'En-Nesyri', 'Amrabat', 'Ounahi', 'Bounou', 'Aguerd', 'Mazraoui', 'Adli', 'El Khannouss', 'Saibari', 'Ben Seghir', 'Akhomach', 'Ezzalzouli', 'Richardson', 'El Kajoui', 'Riad', 'Aboukhlal', 'El Kaabi']
  },
  Tunisia: {
    nationality: 'Tunisia',
    flag: '🇹🇳',
    firstNames: ['Ellyes', 'Aissa', 'Hannibal', 'Youssef', 'Ali', 'Montassar', 'Yan', 'Hamza', 'Bechir', 'Elias', 'Seifeddine', 'Mohamed', 'Houssem', 'Sayfallah', 'Wajdi', 'Alaa', 'Nader', 'Aymen', 'Ferjani', 'Anis'],
    lastNames: ['Skhiri', 'Laidouni', 'Mejbri', 'Msakni', 'Abdi', 'Talbi', 'Valery', 'Rafia', 'Ben Said', 'Achouri', 'Jaziri', 'Ali Ben Romdhane', 'Tka', 'Ltaief', 'Kechrida', 'Gram', 'Ghandri', 'Dahmen', 'Sassi', 'Ben Slimane']
  },
  SouthAfrica: {
    nationality: 'South Africa',
    flag: '🇿🇦',
    firstNames: ['Percy', 'Themba', 'Ronwen', 'Lyle', 'Teboho', 'Sphephelo', 'Khuliso', 'Grant', 'Aubrey', 'Iqraam', 'Oswin', 'Bathusi', 'Thapelo', 'Elias', 'Sipho', 'Evidence', 'Nkosinathi', 'Terrence', 'Relebohile', 'Mihlali'],
    lastNames: ['Tau', 'Zwane', 'Williams', 'Foster', 'Mokoena', 'Sithole', 'Mudau', 'Kekana', 'Modiba', 'Rayners', 'Appollis', 'Aubaas', 'Morena', 'Mokwana', 'Chaine', 'Makgopa', 'Sibisi', 'Mashego', 'Mofokeng', 'Mayambela']
  },
  Nigeria: {
    nationality: 'Nigeria',
    flag: '🇳🇬',
    firstNames: ['Victor', 'Ademola', 'Samuel', 'Alex', 'Wilfred', 'Calvin', 'Stanley', 'Raphael', 'Frank', 'Semi', 'Bright', 'Moses', 'Fisayo', 'Alhassan', 'Taiwo', 'Kelechi', 'Terem', 'Ola', 'Chidera', 'Benjamin'],
    lastNames: ['Osimhen', 'Lookman', 'Chukwueze', 'Iwobi', 'Ndidi', 'Bassey', 'Nwabali', 'Onyedika', 'Onyeka', 'Ajayi', 'Osayi-Samuel', 'Simon', 'Dele-Bashiru', 'Yusuf', 'Awoniyi', 'Iheanacho', 'Moffi', 'Aina', 'Ejuke', 'Fredrick']
  },
  Portugal: {
    nationality: 'Portugal',
    flag: '🇵🇹',
    firstNames: ['Bernardo', 'Bruno', 'Rafael', 'Ruben', 'Diogo', 'Joao', 'Vitinha', 'Pedro', 'Nuno', 'Goncalo', 'Francisco', 'Antonio', 'Matheus', 'Nelson', 'Jose', 'Diogo', 'Renato', 'Fabio', 'Tiago', 'Joao'],
    lastNames: ['Silva', 'Fernandes', 'Leao', 'Dias', 'Costa', 'Neves', 'Vitinha', 'Neto', 'Mendes', 'Inacio', 'Conceicao', 'Silva', 'Nunes', 'Semedo', 'Sa', 'Dalot', 'Sanches', 'Vieira', 'Djalo', 'Felix']
  },
  Netherlands: {
    nationality: 'Netherlands',
    flag: '🇳🇱',
    firstNames: ['Virgil', 'Frenkie', 'Cody', 'Tijjani', 'Xavi', 'Jeremie', 'Nathan', 'Micky', 'Bart', 'Ryan', 'Jurrien', 'Teun', 'Donyell', 'Brian', 'Quinten', 'Matthijs', 'Stefan', 'Lutsharel', 'Ian', 'Joey'],
    lastNames: ['van Dijk', 'de Jong', 'Gakpo', 'Reijnders', 'Simons', 'Frimpong', 'Ake', 'van de Ven', 'Verbruggen', 'Gravenberch', 'Timber', 'Koopmeiners', 'Malen', 'Brobbey', 'Timber', 'de Ligt', 'de Vrij', 'Geertruida', 'Maatsen', 'Veerman']
  },
  Croatia: {
    nationality: 'Croatia',
    flag: '🇭🇷',
    firstNames: ['Luka', 'Josko', 'Mateo', 'Dominik', 'Lovro', 'Mario', 'Martin', 'Luka', 'Josip', 'Josip', 'Borna', 'Andrej', 'Petar', 'Bruno', 'Marco', 'Marin', 'Igor', 'Nikola', 'Kristijan', 'Duje'],
    lastNames: ['Modric', 'Gvardiol', 'Kovacic', 'Livakovic', 'Majer', 'Pasalic', 'Baturina', 'Sucic', 'Stanisic', 'Sutalo', 'Sosa', 'Kramaric', 'Musa', 'Petkovic', 'Pasalic', 'Pongracic', 'Matanovic', 'Vlasic', 'Jakic', 'Caleta-Car']
  }
};

/**
 * Returns authentic player identity (nationality, flag, first & last name) based on league & squad role.
 */
function generateRegionalPlayerIdentity(league: LeagueDef, isForeignStar: boolean = false): {
  nationality: string;
  flag: string;
  firstName: string;
  lastName: string;
} {
  const nativeCountryKey = league.nativeCountry || 'England';
  const nativeData = REGIONAL_NAMES[nativeCountryKey] || REGIONAL_NAMES.England;

  let selectedCountry = nativeData;

  if (isForeignStar) {
    // Select from culturally appropriate foreign talent pools
    const foreignPools = [
      'Brazil', 'Argentina', 'France', 'Spain', 'Germany', 'Portugal', 'Netherlands',
      'Nigeria', 'Morocco', 'Egypt', 'Japan', 'Colombia', 'Uruguay', 'Croatia', 'USA'
    ];
    const candidate = foreignPools[Math.floor(Math.random() * foreignPools.length)];
    if (REGIONAL_NAMES[candidate]) {
      selectedCountry = REGIONAL_NAMES[candidate];
    }
  }

  const fName = selectedCountry.firstNames[Math.floor(Math.random() * selectedCountry.firstNames.length)];
  const lName = selectedCountry.lastNames[Math.floor(Math.random() * selectedCountry.lastNames.length)];

  return {
    nationality: selectedCountry.nationality,
    flag: selectedCountry.flag,
    firstName: fName,
    lastName: lName
  };
}

export function generateClubSportingDirector(
  clubName: string,
  country: string = 'England',
  reputation: number = 75
): SportingDirectorProfile {
  const famousDirectors: Record<string, Partial<SportingDirectorProfile>> = {
    'Manchester City': { name: 'Txiki Begiristain', rating: 94, scoutingRating: 92, tacticalFocus: 'Possession', personality: 'Visionary Architect' },
    'Liverpool': { name: 'Michael Edwards', rating: 95, scoutingRating: 96, tacticalFocus: 'Moneyball Analytics', personality: 'Shrewd Operator' },
    'Arsenal': { name: 'Edu Gaspar', rating: 90, scoutingRating: 88, tacticalFocus: 'Attacking', personality: 'Aggressive Closer' },
    'Real Madrid': { name: 'Juni Calafat', rating: 96, scoutingRating: 98, tacticalFocus: 'Youth-First', personality: 'Visionary Architect' },
    'Barcelona': { name: 'Deco', rating: 88, scoutingRating: 89, tacticalFocus: 'Possession', personality: 'Shrewd Operator' },
    'Paris Saint-Germain': { name: 'Luis Campos', rating: 93, scoutingRating: 95, tacticalFocus: 'Moneyball Analytics', personality: 'Shrewd Operator' },
    'Bayern Munich': { name: 'Max Eberl', rating: 91, scoutingRating: 90, tacticalFocus: 'Attacking', personality: 'Hardline Negotiator' },
    'Inter Milan': { name: 'Piero Ausilio', rating: 90, scoutingRating: 89, tacticalFocus: 'Pragmatic', personality: 'Shrewd Operator' },
    'Juventus': { name: 'Cristiano Giuntoli', rating: 92, scoutingRating: 94, tacticalFocus: 'Moneyball Analytics', personality: 'Visionary Architect' },
    'Atletico Madrid': { name: 'Andrea Berta', rating: 89, scoutingRating: 88, tacticalFocus: 'Counter-Attack', personality: 'Hardline Negotiator' },
    'Bayer Leverkusen': { name: 'Simon Rolfes', rating: 93, scoutingRating: 94, tacticalFocus: 'Attacking', personality: 'Visionary Architect' },
    'Borussia Dortmund': { name: 'Sebastian Kehl', rating: 89, scoutingRating: 93, tacticalFocus: 'Youth-First', personality: 'Shrewd Operator' },
  };

  const matched = famousDirectors[clubName];
  const firstNames = ['Marco', 'Julian', 'Laurent', 'Guillermo', 'Dan', 'Fabio', 'Paul', 'Ralf', 'Sven', 'Monchi', 'Mateu', 'Aitor', 'Hugo', 'Tiago'];
  const lastNames = ['Mitchell', 'Rangnick', 'Alemany', 'Paratici', 'Mislintat', 'Freund', 'Berta', 'Vianna', 'Cordoba', 'Vivell', 'Steidten', 'Fontana', 'Rosell', 'Krosche'];
  const foci: SportingDirectorProfile['tacticalFocus'][] = ['Attacking', 'Possession', 'Counter-Attack', 'Youth-First', 'Moneyball Analytics', 'Pragmatic'];
  const personalities: SportingDirectorProfile['personality'][] = ['Shrewd Operator', 'Aggressive Closer', 'Prudent Scout', 'Visionary Architect', 'Hardline Negotiator'];

  const dirName = matched?.name || `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
  const dirRating = matched?.rating || Math.min(96, Math.max(60, reputation + Math.floor(Math.random() * 8) - 4));
  const scoutRating = matched?.scoutingRating || Math.min(97, Math.max(62, reputation + Math.floor(Math.random() * 8) - 3));
  const focus = matched?.tacticalFocus || foci[Math.floor(Math.random() * foci.length)];
  const personality = matched?.personality || personalities[Math.floor(Math.random() * personalities.length)];

  return {
    id: `sd_${clubName.toLowerCase().replace(/[^a-z0-9]/g, '')}_${Math.floor(Math.random() * 1000)}`,
    name: dirName,
    avatar: '👔',
    rating: dirRating,
    scoutingRating: scoutRating,
    tacticalFocus: focus,
    personality: personality,
    wage: Math.round(dirRating * 350),
    contractYears: 3,
    dealSuccessBonus: Math.round((dirRating - 50) * 0.4),
    historicalSigningsCount: Math.floor(Math.random() * 20) + 10,
    totalSpent: Math.floor(Math.random() * 150000000) + 20000000
  };
}

export function generateClubBoardOfDirectors(
  clubName: string,
  reputation: number = 75,
  transferBudget: number = 25000000,
  wageBudget: number = 1000000
): BoardOfDirectorsState {
  const chairpersonStances: BoardOfDirectorsState['chairpersonStance'][] = [
    'Supportive & Ambitious',
    'Prudent & Frugal',
    'Demanding Tycoon',
    'Impatient Win-Now'
  ];

  const stance = chairpersonStances[Math.floor(Math.random() * chairpersonStances.length)];
  const spendLimit = Math.max(15000000, Math.round(transferBudget * 0.65));
  const wageCap = Math.max(60000, Math.round(wageBudget * 0.25));

  const members: BoardMember[] = [
    {
      id: `bm_1_${clubName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      name: 'Sir Arthur Sterling',
      role: 'Vice-Chairman & Audit Head',
      avatar: '🧐',
      shareholding: 28,
      faction: 'traditionalist',
      loyalty: 85,
      mood: 'satisfied',
      priorities: 'Long-term financial solvency and adherence to wage caps.'
    },
    {
      id: `bm_2_${clubName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      name: 'Elena Rostova',
      role: 'Chief Commercial Officer',
      avatar: '💼',
      shareholding: 22,
      faction: 'commercial',
      loyalty: 80,
      mood: 'delighted',
      priorities: 'Marquee superstar signings that maximize shirt sales and global TV sponsors.'
    },
    {
      id: `bm_3_${clubName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      name: 'Marcus Vance',
      role: 'Majority Shareholder Delegate',
      avatar: '👑',
      shareholding: 35,
      faction: 'commercial',
      loyalty: 75,
      mood: 'satisfied',
      priorities: 'High ROI, continental trophies, and swift player resale profits.'
    },
    {
      id: `bm_4_${clubName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      name: 'Liam O\'Connor',
      role: 'Supporters Trust Trustee',
      avatar: '🏟️',
      shareholding: 10,
      faction: 'fan_representative',
      loyalty: 90,
      mood: 'satisfied',
      priorities: 'Club heritage, academy graduate playing time, and affordable fan culture.'
    },
    {
      id: `bm_5_${clubName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      name: 'Prof. Henrik Lindqvist',
      role: 'Sporting Strategy Adviser',
      avatar: '📊',
      shareholding: 5,
      faction: 'sporting',
      loyalty: 82,
      mood: 'satisfied',
      priorities: 'Modern tactical cohesion, squad depth, and sports science investment.'
    }
  ];

  const mandates: BoardMandate[] = [
    {
      id: `mnd_1_${clubName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      title: 'Fiscal Solvency & Spending Cap',
      category: 'financial',
      description: `Keep single player transfer fees strictly below €${(spendLimit / 1000000).toFixed(1)}M unless emergency board approval is ratified.`,
      targetMetric: 'Max Single Transfer Fee',
      targetValue: spendLimit,
      currentValue: 0,
      status: 'on_track',
      deadlineSeason: 1,
      rewardApprovalBonus: 10,
      penaltyOnFailure: 15
    },
    {
      id: `mnd_2_${clubName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      title: 'Youth Pathway Directives',
      category: 'youth',
      description: 'Sporting Director must target promising U21 talent with 80+ potential.',
      targetMetric: 'U21 Signings / Academy Stars',
      targetValue: 2,
      currentValue: 1,
      status: 'on_track',
      deadlineSeason: 1,
      rewardApprovalBonus: 8,
      penaltyOnFailure: 8
    },
    {
      id: `mnd_3_${clubName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      title: 'Continental Reputation & Competitiveness',
      category: 'sporting',
      description: 'Achieve at least top-half league finish and positive goal differential.',
      targetMetric: 'League Points',
      targetValue: reputation > 80 ? 65 : 45,
      currentValue: 0,
      status: 'on_track',
      deadlineSeason: 1,
      rewardApprovalBonus: 15,
      penaltyOnFailure: 20
    }
  ];

  return {
    boardTrust: 80,
    chairpersonName: `Lord Alistair Sterling`,
    chairpersonStance: stance,
    members,
    mandates,
    spendingLimitPerTransfer: spendLimit,
    wageCapPerPlayer: wageCap,
    emergencyBailoutAvailable: true,
    emergencyBailoutAmount: Math.round(transferBudget * 0.4),
    boardMeetingsHistory: [
      {
        id: `bm_hist_0`,
        week: 1,
        season: 1,
        topic: 'Inaugural Presidential Governance Charter',
        outcome: 'approved',
        voteTally: '5 In Favor, 0 Against',
        summary: 'The Board unanimously ratified the Club President delegation framework: the Sporting Director shall lead negotiations, while the President retains absolute final approval.'
      }
    ]
  };
}

export function ensureClubSportingDirectorAndBoard(club: Club): Club {
  const director = club.sportingDirectorProfile || generateClubSportingDirector(club.name, club.country || 'England', club.reputation);
  const board = club.boardOfDirectors || generateClubBoardOfDirectors(club.name, club.reputation, club.transferBudget, club.wageBudget);
  return {
    ...club,
    sportingDirector: director.name,
    sportingDirectorProfile: director,
    boardOfDirectors: board,
    pendingPresidentialTransfers: club.pendingPresidentialTransfers || [],
    sportingDirectorTasks: club.sportingDirectorTasks || []
  };
}

export function generateProceduralClubs(): Club[] {
  const clubs: Club[] = [];
  let clubCount = 1;

  CONTINENTAL_LEAGUES.forEach((league) => {
    const existingLeagueClubs = INITIAL_CLUBS.filter(c => c.league === league.name || (league.id === 'usa_mls' && c.league === 'MLS'));

    existingLeagueClubs.forEach((initClub, idx) => {
      const headCoach = initClub.headCoach || initClub.managerName || `Manager ${initClub.name} Coach`;
      const staffList: Club['staffList'] = initClub.staffList || [
        { id: `stf_${initClub.id}_1`, name: headCoach, role: 'Head Manager', rating: initClub.reputation, nationality: league.country },
        { id: `stf_${initClub.id}_2`, name: `Coach Staff 2`, role: 'Assistant Manager', rating: Math.max(60, initClub.reputation - 5), nationality: league.country },
        { id: `stf_${initClub.id}_3`, name: `Scout Staff 3`, role: 'Head Scout', rating: Math.max(65, initClub.reputation - 3), nationality: league.country },
        { id: `stf_${initClub.id}_4`, name: `Trainer Staff 4`, role: 'Physical Trainer', rating: Math.max(60, initClub.reputation - 4), nationality: league.country },
        { id: `stf_${initClub.id}_5`, name: `Dr. Medical 5`, role: 'Chief Medical Officer', rating: Math.max(70, initClub.reputation - 2), nationality: league.country }
      ];

      const enrichedClub: Club = ensureClubSportingDirectorAndBoard({
        ...initClub,
        league: league.name,
        tier: league.tier,
        continent: league.continent,
        headCoach,
        staffList,
        leagueCoefficient: league.coefficient
      });

      clubs.push(enrichedClub);
    });

    const TARGET_TEAMS = 20;
    const needed = Math.max(0, TARGET_TEAMS - existingLeagueClubs.length);

    const LEAGUE_NAMING_POOLS: Record<string, string[]> = {
      eng_pl: ['Newcastle Magpies', 'Brighton Seagulls', 'West Ham Hammers', 'Wolverhampton Wolves', 'Crystal Palace Eagles', 'Everton Toffees', 'Fulham Cottagers', 'Brentford Bees', 'Bournemouth Cherries', 'Nottingham Forest Reds', 'Leicester Foxes', 'Leeds Whites', 'Southampton Saints', 'Ipswich Tractor Boys', 'Sheffield Blades', 'Burnley Clarets', 'Norwich Canaries', 'Watford Hornets', 'Sunderland Black Cats', 'Middlesbrough Boro'],
      eng_ch: ['Sheffield Blades', 'Burnley Clarets', 'Norwich Canaries', 'West Brom Baggies', 'Sunderland Black Cats', 'Watford Hornets', 'Middlesbrough Boro', 'Coventry Sky Blues', 'Hull Tigers', 'Blackburn Rovers', 'Stoke Potters', 'Derby Rams', 'Swansea Swans', 'Bristol City Robins', 'Preston North End', 'Queens Park Rangers', 'Cardiff Bluebirds', 'Plymouth Pilgrims', 'Millwall Lions', 'Luton Hatters'],
      esp_ll: ['Athletic Bilbao Lions', 'Real Sociedad Txuri-Urdin', 'Real Betis Verdiblancos', 'Villarreal Yellow Submarine', 'Sevilla Rojiblancos', 'Valencia Bats', 'Girona City', 'Celta Vigo Sky Blues', 'Mallorca Bermellones', 'Osasuna Gorritxoak', 'Rayo Vallecano Franjirrojos', 'Las Palmas Yellows', 'Getafe Azulones', 'Deportivo Alaves Babazorros', 'Espanyol Periquitos', 'Real Valladolid Pucela', 'Leganes Pepineros', 'Levante Granotas', 'Real Zaragoza Maños', 'Granada Nazaries'],
      esp_l2: ['Levante Granotas', 'Real Zaragoza Maños', 'Real Sporting Gijon', 'Real Oviedo Carbayones', 'Cadiz Amarillos', 'Granada Nazaries', 'Almeria Indalicos', 'Racing Santander Verdiblancos', 'Eibar Armeros', 'Tenerife Blanquiazules', 'Albacete Queso Mecanico', 'Burgos Blanquinegros', 'Elche Franjiverdes', 'Huesca Oscenses', 'Mirandes Jabatos', 'Cartagena Efese', 'Castellon Orelluts', 'Cordoba Blanquiverdes', 'Malaga Boquerones', 'Deportivo La Coruna Branquiazuis'],
      ita_sa: ['Napoli Partenopei', 'Roma Giallorossi', 'Lazio Biancocelesti', 'Atalanta Bergamasca', 'Fiorentina Viola', 'Bologna Rossoblu', 'Torino Granata', 'Monza Biancorossi', 'Genoa Grifone', 'Udinese Zebrette', 'Cagliari Isolani', 'Hellas Verona Scaligeri', 'Parma Crociati', 'Como Lariani', 'Lecce Salentini', 'Empoli Azzurri', 'Venezia Arancioneroverdi', 'Sassuolo Neroverdi', 'Frosinone Canarini', 'Palermo Aquile'],
      ita_sb: ['Sassuolo Neroverdi', 'Frosinone Canarini', 'Salernitana Granata', 'Palermo Aquile', 'Cremonese Grigiorossi', 'Sampdoria Blucerchiati', 'Brescia Rondinelle', 'Catanzaro Aquile', 'Bari Galletti', 'Modena Canarini', 'Pisa Nerazzurri', 'Reggiana Granata', 'Sudtirol Bianco Rossi', 'Spezia Aquilotti', 'Cesena Cavallucci', 'Mantova Virgiliani', 'Juve Stabia Vespe', 'Carrarese Apuani', 'Cittadella Granata', 'Cosenza Lupi'],
      ger_bl: ['Leverkusen Werkself', 'RB Leipzig Bulls', 'Frankfurt Eagles', 'Stuttgart Cannstatt', 'Wolfsburg Wolves', 'Borussia Gladbach Foals', 'Freiburg Breisgau', 'Union Berlin Iron', 'Hoffenheim Kraichgau', 'Werder Bremen Green-Whites', 'Augsburg Fuggerstadter', 'Mainz 05 Karneval', 'Heidenheim Ostalb', 'St. Pauli Pirates', 'Holstein Kiel Storks', 'Bochum Blue-Whites', 'Schalke 04 Royal Blues', 'Hamburg Rothosen', 'Hertha Berlin Old Lady', 'FC Koln Billy Goats'],
      ger_b2: ['Hertha Berlin Old Lady', 'FC Koln Billy Goats', 'Fortuna Dusseldorf Flingern', 'Hannover 96 Reds', 'Nurnberg Club', 'Kaiserslautern Red Devils', 'Karlsruher Baden', 'Paderborn Blue-Whites', 'Greuther Furth Cloverleaves', 'Magdeburg Blue-Whites', 'Eintracht Braunschweig Lions', 'Darmstadt 98 Lilies', 'Preussen Munster Eagles', 'SSV Ulm Sparrows', 'Jahn Regensburg Red-Whites', 'SV Elversberg Black-Whites', 'Wehen Wiesbaden Red-Blacks', 'Hansa Rostock Kogge', 'Osnabruck VFL', 'Dynamo Dresden Yellow-Blacks'],
      fra_l1: ['Monaco Principality', 'Marseille Olympians', 'Lyon Gones', 'Lille Dogues', 'Nice Gym', 'Lens Sang et Or', 'Rennes Rennais', 'Brest Pirates', 'Reims Champenois', 'Strasbourg Racing', 'Toulouse Violets', 'Montpellier Paillade', 'Nantes Canaris', 'Auxerre AJA', 'Saint-Etienne Greens', 'Angers SCO', 'Le Havre Sky-Navies', 'Bordeaux Marine-Blues', 'Metz Grenats', 'Lorient Merlus'],
      fra_l2: ['Lorient Merlus', 'Clermont Foot 63', 'Paris FC Blues', 'Guingamp En Avant', 'Caen Malherbe', 'Bastia Turchini', 'Grenoble Foot 38', 'Pau Pyrenees', 'Amiens Unicorns', 'Rodez Blood-Gold', 'Laval Tangos', 'Annecy Reds', 'Ajaccio Bears', 'Troyes ESTAC', 'Dunkerque Maritime', 'Martigues Blood-Gold', 'Red Star Paris 1897', 'Valenciennes Swans', 'Quevilly-Rouen Normands', 'Nancy Thistle'],
      bra_sa: ['Flamengo Mengão', 'Palmeiras Verdão', 'São Paulo Tricolor', 'Atlético Mineiro Galo', 'Botafogo Estrela Solitária', 'Fluminense Guerreiros', 'Grêmio Imortal', 'Internacional Colorado', 'Corinthians Timão', 'Cruzeiro Cabuloso', 'Vasco da Gama Gigante', 'Athletico Paranaense Furacão', 'Bahia Tricolor de Aço', 'Fortaleza Leão do Pici', 'Red Bull Bragantino Massa Bruta', 'Santos Peixe', 'Juventude Papo', 'Criciúma Tigre', 'Vitória Rubro-Negro', 'Atlético Goianiense Dragão'],
      arg_pd: ['River Plate Millonarios', 'Boca Juniors Xeneizes', 'Racing Club Academia', 'Independiente Rey de Copas', 'San Lorenzo Cuervos', 'Vélez Sarsfield Fortín', 'Estudiantes Pincha', 'Rosario Central Canalla', 'Newell\'s Old Boys Lepra', 'Talleres Matador', 'Lanús Granate', 'Defensa y Justicia Halcón', 'Argentinos Juniors Bicho', 'Huracán Globo', 'Belgrano Pirata', 'Godoy Cruz Tomba', 'Gimnasia La Plata Lobo', 'Banfield Taladro', 'Platense Calamar', 'Atlético Tucumán Decano'],
      col_pa: ['Atlético Nacional Verdolagas', 'Millonarios Embajadores', 'América de Cali Diablos Rojos', 'Santa Fe Cardenales', 'Junior Barranquilla Tiburones', 'Deportivo Cali Azucareros', 'Independiente Medellín Poderoso', 'Once Caldas Albos', 'Deportes Tolima Pijaos', 'Deportivo Pereira Matecañas', 'Atlético Bucaramanga Leopardos', 'Águilas Doradas', 'La Equidad Aseguradores', 'Deportivo Pasto Volcánicos', 'Jaguares de Córdoba', 'Envigado Cantera de Héroes', 'Alianza Petrolera', 'Boyacá Chicó Ajedrezados', 'Patriotas Boyacá', 'Fortaleza CEIF'],
      chi_pd: ['Colo-Colo Cacique', 'Universidad de Chile La U', 'Universidad Católica Cruzados', 'Cobreloa Zorros del Desierto', 'Unión Española Hispanos', 'Palestino Árabes', 'Everton Viña del Mar Ruleteros', 'Audax Italiano Audinos', 'Huachipato Acereros', 'O\'Higgins Capo de Provincia', 'Cobresal Mineros', 'Coquimbo Unido Piratas', 'Deportes Iquique Dragones Celestes', 'Ñublense Diablos Rojos', 'Unión La Calera Cementeros', 'Deportes Antofagasta Pumas', 'Santiago Wanderers Caturros', 'Magallanes Carabeleros', 'Curicó Unido Torteros', 'Rangers de Talca Rojinegros'],
      uru_pd: ['Nacional Tricolores', 'Peñarol Carboneros', 'Defensor Sporting Violetas', 'Danubio Franjeados', 'Montevideo Wanderers Bohemios', 'Liverpool Montevideo Negriazules', 'River Plate Darseneros', 'Cerro Porteño Albicelestes', 'Boston River Sastre', 'Fénix Albivioletas', 'Racing de Montevideo Cerveceros', 'Progreso Gauchos', 'Miramar Misiones Cebras', 'Deportivo Maldonado Rojiverdes', 'Rampla Juniors Picapiedras', 'Plaza Colonia Patas Blancas', 'Cerro Largo Arachanes', 'Rentistas Bichos Colorados', 'Sud América Buzones', 'Villa Española Hispanos'],
      usa_mls: ['LA Galaxy Hollywood', 'Los Angeles FC Black & Gold', 'New York City Blue', 'New York Red Bulls', 'Atlanta United Five Stripes', 'Seattle Sounders Emeralds', 'Portland Timbers Rose City', 'Philadelphia Union Doop', 'Columbus Crew Massive', 'FC Cincinnati Orange & Blue', 'Toronto FC Reds', 'Vancouver Whitecaps Blue', 'CF Montréal Impact', 'Austin FC Verde', 'Nashville SC Music City', 'Houston Dynamo Orange', 'Sporting Kansas City Blue', 'St. Louis CITY SC Red', 'Minnesota United Loons', 'Chicago Fire Red'],
      mex_lmx: ['Club América Águilas', 'Guadalajara Chivas Rayadas', 'Cruz Azul Máquina Celeste', 'Pumas UNAM Universitarios', 'Tigres UANL Auriazules', 'Monterrey Rayados', 'Toluca Diablos Rojos', 'Santos Laguna Guerreros', 'Pachuca Tuzos', 'León Esmeraldas', 'Atlas Rojinegros', 'Tijuana Xolos', 'Necaxa Rayos', 'Puebla Franjirrojos', 'Atlético San Luis Tuneros', 'Mazatlán Cañoneros', 'Querétaro Gallos Blancos', 'FC Juárez Bravos', 'Atlante Potros de Hierro', 'Celaya Toros'],
      usa_usl: ['Louisville City Boys in Purple', 'Phoenix Rising Firebirds', 'Sacramento Republic Quails', 'Tampa Bay Rowdies Greens', 'San Antonio FC Texans', 'Colorado Springs Switchbacks', 'Charleston Battery Black & Yellow', 'Detroit City Le Rouge', 'Indy Eleven Brickyard', 'Orange County SC Blues', 'New Mexico United Black & Yellow', 'Memphis 901 Beale Street', 'Birmingham Legion Hammers', 'El Paso Locomotive Train', 'Pittsburgh Riverhounds Hounds', 'Miami FC Freedom', 'North Carolina FC Dead Whales', 'Monterey Bay Union Crisp & Kelp', 'Rhode Island FC Anchors', 'Las Vegas Lights Neon'],
      can_cpl: ['Forge FC Hamilton Hammers', 'Cavalry FC Calgary Foot Soldiers', 'Pacific FC Trident Island', 'Atlético Ottawa Capital Red-Whites', 'Vancouver FC Eagles', 'York United Nine Stripes', 'Valour FC Winnipeg Maroons', 'HFX Wanderers Atlantic Navies', 'Edmonton Aviators', 'Montreal Royal City', 'Toronto Metro Stars', 'Quebec City Citadelles', 'Calgary Blizzard', 'Ottawa St. Laurent', 'Kitchener-Waterloo Techs', 'London City Forest', 'Victoria Harbours', 'Halifax Seaport', 'Saskatoon Prairie Wolves', 'Kelowna Sunburst'],
      crc_pd: ['Deportivo Saprissa Monstruo Morado', 'Liga Deportiva Alajuelense Manudos', 'Club Sport Herediano Florenses', 'Club Sport Cartaginés Brumosos', 'Santos de Guápiles Santistas', 'Municipal Pérez Zeledón Guerreros', 'Puntarenas FC Puerto', 'San Carlos Toros del Norte', 'Municipal Liberia Coyotes', 'Sporting San José Pumas', 'Guanacasteca Pamperos', 'Carmelita Verdolagas', 'Uruguay de Coronado Lecheros', 'Barrio México Canarios', 'Guadalupe FC Guadalupanos', 'AS Puma Generaleña', 'Jicaral Sercoba Huracán', 'Jacó Rays Coastal', 'Limón Black Star', 'Turrialba Azucareros'],
      sau_spl: ['Riyadh Al-Hilal Blue Crescent', 'Jeddah Al-Ahli Royals', 'Riyadh Al-Shabab White Lions', 'Dammam Al-Ettifaq Commandos', 'Al-Taawoun Wolves', 'Al-Fateh Sons of the Palm', 'Al-Fayha Orange Flame', 'Al-Khaleej Gulf Eagles', 'Al-Raed Pioneers', 'Al-Wehda Knights of Mecca', 'Damac Red Knights', 'Al-Hazem Oasis', 'Al-Okhdood Shield', 'Al-Riyadh Capital Greens', 'Al-Kholood Pride', 'Al-Qadsiah Knights of the East', 'Al-Adalah Justice', 'Al-Batin Sky Blues', 'Najran Desert Warriors', 'Al-Tai Grey Wolf'],
      jpn_j1: ['Vissel Kobe Crimson Port', 'Yokohama F. Marinos Sailors', 'Kawasaki Frontale Blue Sky', 'Urawa Red Diamonds Reds', 'Kashima Antlers Deer', 'Sanfrecce Hiroshima Three Arrows', 'Nagoya Grampus Orcas', 'Gamba Osaka Black-Blues', 'Cerezo Osaka Cherry Blossoms', 'FC Tokyo Gas Capitals', 'Machida Zelvia Blue Warriors', 'Kyoto Sanga Purple Phoenix', 'Avispa Fukuoka Hornets', 'Albirex Niigata Swan Orange', 'Kashiwa Reysol Sun Kings', 'Shonan Bellmare Sea Breeze', 'Jubilo Iwata Blue Birds', 'Tokyo Verdy Green Stars', 'Consadole Sapporo Red-Blacks', 'Sagan Tosu Magpies'],
      kor_k1: ['Ulsan HD Tigers', 'Jeonbuk Hyundai Green Motors', 'FC Seoul Capital Red-Blacks', 'Pohang Steelers Iron Forge', 'Suwon Samsung Bluewings', 'Gwangju FC Yellow Hawks', 'Incheon United Blue-Blacks', 'Gangwon FC Great Bear', 'Daejeon Hana Citizen Greens', 'Daegu FC Sky Blues', 'Jeju United Windriders', 'Gimcheon Sangmu Military', 'Suwon FC Citizens', 'Seongnam FC Black Magpies', 'Busan IPark Red Royals', 'Gyeongnam FC Rose-Blacks', 'Seoul E-Land Leopards', 'Chungnam Asan Owls', 'Bucheon FC 1995 Red-Blacks', 'Anyang FC Violets'],
      qat_qsl: ['Al-Sadd Wolves', 'Al-Duhail Red Knights', 'Al-Rayyan Lions', 'Al-Arabi Red Devils', 'Al-Gharafa Cheetahs', 'Al-Wakrah Blue Waves', 'Qatar SC Yellow Kings', 'Umm Salal Barzan Falcons', 'Al-Ahli Doha Brigadiers', 'Al-Shamal Northern Pride', 'Al-Markhiya Oryx', 'Muaither Stallions', 'Al-Sailiya Black & Blue', 'Al-Kharaitiyat Thunders', 'Al-Shahania Desert Foxes', 'Lusail City Gladiators', 'Mesaimeer Flame', 'Al-Bidda Coastals', 'Al-Waab Knights', 'Pearl FC Stars'],
      uae_upl: ['Al-Ain Boss Violet', 'Shabab Al-Ahli Dubai Red Knights', 'Al-Wasl Cheetahs', 'Sharjah FC The King', 'Al-Wahda Maroon Claret', 'Al-Jazira Pride of Abu Dhabi', 'Al-Nasr Dubai Blue Wave', 'Baniyas Sky Blues', 'Ajman Orange Brigade', 'Khorfakkan Eagles', 'Kalba Yellow Tigers', 'Al-Bataeh Desert Riders', 'Emirates Club Falcon Greens', 'Hatta FC Mountain Waves', 'Dibba Al-Fujairah Sailors', 'Al-Dhafra Western Knights', 'Dubai City Desert Stars', 'Gulf United Eagles', 'Masfout White Falcons', 'Al-Rams Palm Trees'],
      egy_epl: ['Al Ahly Cairo Red Devils', 'Zamalek White Knights', 'Pyramids FC Sky Blue Pharaohs', 'Future FC Modern Stars', 'Al Masry Green Eagles', 'Al Ittihad Alexandria Masters', 'ENPPI Petroleum Energy', 'Smouha Blue Waves', 'Ismaily Brazilian Dervishes', 'Ceramica Cleopatra Pharaohs', 'Bank Al Ahly Bankers', 'Tala\'ea El Gaish Vanguard', 'Pharco FC Medics', 'National Bank SC Greens', 'El Gouna Red Sea', 'Baladiyat El Mahalla Weavers', 'ZED FC Future Tech', 'Arab Contractors Mountain Wolves', 'Ghazl El Mahalla Cotton', 'Haras El Hodoud Border Guards'],
      mar_bot: ['Wydad AC Red Castle', 'Raja Casablanca Green Eagles', 'AS FAR Royal Army', 'FUS Rabat Union Capital', 'RS Berkane Orange Oranges', 'MAS Fez Yellow Canaries', 'Olympic Safi Blue Sharks', 'Hassania Agadir Gazelles', 'Maghreb Tetouan Northern Stars', 'IR Tanger Strait Giants', 'Union Touarga Capital Blue', 'Chabab Mohammedia Fedala', 'Renaissance Zemamra Falcons', 'Youssoufia Berrechid Greens', 'Mouloudia Oujda Border Reds', 'Kawkab Marrakech Red Palms', 'Difaa El Jadida Knights', 'Olympic Khouribga Miners', 'Kenitra AC Green Knights', 'Racing de Casablanca Stars'],
      rsa_psl: ['Mamelodi Sundowns Brazilians', 'Kaizer Chiefs Amakhosi Glamour Boys', 'Orlando Pirates Sea Robbers', 'SuperSport United Matsatsantsa', 'Stellenbosch FC Winelands', 'Sekhukhune United Babina Noko', 'Cape Town City Blue Cityzens', 'TS Galaxy The Rockets', 'Golden Arrows Backheelers', 'Chippa United Chilli Boys', 'Polokwane City Rise and Shine', 'Moroka Swallows Birds', 'AmaZulu Usuthu Warriors', 'Richards Bay Natal Rich Boyz', 'Royal AM Thwihli Thwahla', 'Maritzburg United Team of Choice', 'Baroka FC Bakgaga', 'Bloemfontein Celtic Green Phunya', 'Black Leopards Lidoda Duvha', 'Jomo Cosmos Ezenkosi'],
      tun_lp1: ['Espérance de Tunis Blood & Gold', 'Étoile du Sahel Red Star', 'Club Africain Tunis Red & White', 'CS Sfaxien Juventus of the Arabs', 'US Monastir Ribat Blues', 'Stade Tunisien Bardois', 'US Ben Guerdane Desert Yellows', 'CA Bizertin Northern Sharks', 'EGS Gafsa Miners', 'Olympique Béja Storks', 'AS Soliman Coastal Stars', 'ES Métlaoui Phosphaters', 'US Tataouine South Warriors', 'AS Marsa Green Avenirs', 'JS Kairouan Aghlabid Falcons', 'CS Hammam-Lif Suburbans', 'ES Zarzis Sang et Or', 'Stade Gabésien Green Stays', 'AS Gabès Black & White', 'Jendouba Sport Foresters'],
      nga_npfl: ['Enyimba International Peoples Elephant', 'Remo Stars Sky Blue Stars', 'Rivers United Pride of Rivers', 'Rangers International Flying Antelopes', 'Kano Pillars Sai Masu Gida', 'Plateau United Peace Boys', 'Bendel Insurance Benin Arsenals', 'Shooting Stars 3SC Oluyole Warriors', 'Akwa United Promise Keepers', 'Lobi Stars Ortom Boys', 'Sunshine Stars Owena Whales', 'Heartland FC Naze Millionaires', 'Katsina United Changi Boys', 'Kwara United Harmony Boys', 'Bayelsa United Prosperity Boys', 'Abia Warriors Umuahia', 'Sporting Lagos Tech Cityzens', 'Gombe United Savannah Scorpions', 'Niger Tornadoes Minna Ikon Allah', 'Doma United Savannah Tigers']
    };

    const namePool = LEAGUE_NAMING_POOLS[league.id] || [];

    for (let teamIdx = 1; teamIdx <= needed; teamIdx++) {
      const isTopTier = league.tier === 1;
      const baseRep = isTopTier ? 90 - Math.floor(teamIdx * 2.2) : 72 - Math.floor(teamIdx * 2.2);
      const rep = Math.max(35, Math.min(98, baseRep));

      const budget = Math.round(rep * (isTopTier ? 1200000 : 320000));
      const wage = Math.round(rep * (isTopTier ? 35000 : 9000));

      const poolIndex = (teamIdx - 1) % namePool.length;
      const poolName = namePool[poolIndex];
      const fallbackPrefixes = ['United', 'City', 'Rovers', 'Athletic', 'Sporting', 'Dynamo', 'Metropolitan', 'Alliance', 'Strikers', 'Lions'];
      const cName = poolName || `${league.country} ${fallbackPrefixes[(teamIdx - 1) % fallbackPrefixes.length]} FC ${teamIdx}`;
      
      const words = cName.split(' ');
      let shortCode = (words.length >= 2)
        ? (words[0].substring(0, 2) + words[1].substring(0, 1)).toUpperCase()
        : cName.substring(0, 3).toUpperCase();
      if (shortCode.length < 3) shortCode = `${league.id.substring(0, 2).toUpperCase()}${teamIdx < 10 ? '0' + teamIdx : teamIdx}`;

      const headCoachName = `Manager ${cName} Coach`;

      const staffList: Club['staffList'] = [
        { id: `stf_mgr_${clubCount}`, name: headCoachName, role: 'Head Manager', rating: Math.min(99, rep + Math.floor(Math.random() * 6)), nationality: league.country },
        { id: `stf_ast_${clubCount}`, name: `Coach Assistant`, role: 'Assistant Manager', rating: Math.max(60, rep - 5), nationality: league.country },
        { id: `stf_sct_${clubCount}`, name: `Chief Scout`, role: 'Head Scout', rating: Math.max(65, rep - 3), nationality: league.country },
        { id: `stf_phy_${clubCount}`, name: `Fitness Trainer`, role: 'Physical Trainer', rating: Math.max(60, rep - 4), nationality: league.country },
        { id: `stf_med_${clubCount}`, name: `Club Doctor`, role: 'Chief Medical Officer', rating: Math.max(70, rep - 2), nationality: league.country }
      ];

      const pClub: Club = ensureClubSportingDirectorAndBoard({
        id: `club_p_${clubCount++}`,
        name: cName,
        shortName: shortCode,
        league: league.name,
        tier: league.tier,
        continent: league.continent,
        reputation: rep,
        transferBudget: budget,
        wageBudget: wage,
        chairmanTrust: Math.floor(Math.random() * 30) + 60,
        chairmanName: `Chairman of ${cName}`,
        sportingDirector: `Director of Football`,
        headCoach: headCoachName,
        staffList,
        leagueCoefficient: league.coefficient,
        logoColor: ['bg-sky-500', 'bg-red-600', 'bg-blue-700', 'bg-purple-600', 'bg-amber-500', 'bg-emerald-600', 'bg-indigo-600', 'bg-rose-600', 'bg-teal-600', 'bg-cyan-600'][teamIdx % 10],
        secondaryColor: 'text-amber-400',
        stadiumCapacity: rep * (isTopTier ? 750 : 350),
        managerName: headCoachName,
        managerTactics: ['Attacking', 'Tiki-Taka', 'Counter-Attack', 'Park the Bus'][teamIdx % 4] as any,
        managementStyle: (teamIdx % 4 === 0 ? 'Sugar-Daddy Aggressive' : teamIdx % 3 === 0 ? 'Corporate Growth' : 'Austerity & Sustainable') as any,
        marketDealing: (teamIdx % 3 === 0 ? 'Aggressive Spender' : teamIdx % 2 === 0 ? 'Prudent Moneyball' : 'Youth Seller & Developer') as any,
        incomeStreamRating: Math.min(99, Math.max(45, rep - 5)),
        bookBalancingCompetence: Math.floor(Math.random() * 25) + 70,
        points: 0,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0
      });

      clubs.push(pClub);
    }
  });

  return clubs;
}

export function ensureTwentyClubsPerLeague(existingClubs: Club[]): Club[] {
  if (!existingClubs || existingClubs.length === 0) {
    return generateProceduralClubs();
  }

  const allProcedural = generateProceduralClubs();
  const resultMap: Map<string, Club[]> = new Map();

  existingClubs.forEach(club => {
    const lgName = club.league === 'MLS' ? 'Major League Soccer' : club.league;
    const current = resultMap.get(lgName) || [];
    current.push(ensureClubSportingDirectorAndBoard({ ...club, league: lgName }));
    resultMap.set(lgName, current);
  });

  const finalClubs: Club[] = [];

  CONTINENTAL_LEAGUES.forEach(league => {
    const currentClubs = resultMap.get(league.name) || [];
    if (currentClubs.length >= 20) {
      finalClubs.push(...currentClubs.slice(0, 20));
    } else {
      const proceduralLeagueClubs = allProcedural.filter(c => c.league === league.name);
      const existingIds = new Set(currentClubs.map(c => c.id));
      const existingNames = new Set(currentClubs.map(c => c.name.toLowerCase()));

      const needed = 20 - currentClubs.length;
      const candidates = proceduralLeagueClubs.filter(c => !existingIds.has(c.id) && !existingNames.has(c.name.toLowerCase()));

      const toAdd = candidates.slice(0, needed);
      finalClubs.push(...currentClubs, ...toAdd);
    }
  });

  return finalClubs.map(c => ensureClubSportingDirectorAndBoard(c));
}

const AGENCIES = [
  'Gestifute Global',
  'Stellar Football Group',
  'OneSGM Empire',
  'Gol International Shadow Agency',
  'Calcio Syndicate Milano',
  'Samba Stars Group'
];

/**
 * Generates all players across all clubs with strict realism:
 * 1. Global rating distribution: Strictly ~5% of players in 88-95 rating range; 90+ are rare superstars (<1%).
 * 2. Realistic Youth Potentials: Not every young player is a wonderkid; realistic bell curve.
 * 3. Nationality distribution matches domestic league and authentic regional proportions.
 */
export function generateProceduralPlayers(clubs: Club[]): Player[] {
  const players: Player[] = [...INITIAL_PLAYERS];
  let pCount = INITIAL_PLAYERS.length + 1;

  const leagueMap = new Map<string, LeagueDef>();
  CONTINENTAL_LEAGUES.forEach(l => {
    leagueMap.set(l.name, l);
    if (l.id === 'usa_mls') leagueMap.set('MLS', l);
  });

  const clubCountMap = new Map<string, number>();
  players.forEach(p => {
    if (p.clubId) {
      clubCountMap.set(p.clubId, (clubCountMap.get(p.clubId) || 0) + 1);
    }
  });

  const generatedNonInitialPlayers: Player[] = [];

  clubs.forEach((club) => {
    const existingCount = clubCountMap.get(club.id) || 0;
    const SQUAD_SIZE = 18;
    const needed = Math.max(0, SQUAD_SIZE - existingCount);
    const leagueDef = leagueMap.get(club.league) || CONTINENTAL_LEAGUES[0];

    const squadPositions: Position[] = [
      'GK', 'GK', 'CB', 'CB', 'CB', 'LB', 'RB',
      'CDM', 'CM', 'CM', 'CAM', 'LW', 'RW',
      'ST', 'ST', 'CB', 'CM', 'ST'
    ];

    for (let i = 0; i < needed; i++) {
      const pos = squadPositions[i % squadPositions.length];
      const isKeyStar = i === 0;
      const isStarter = i >= 1 && i <= 10;
      const isRotation = i >= 11 && i <= 14;
      const isYouthProspect = i >= 15; // Only 3 youth players per 18 squad

      // Age distribution
      const age = isYouthProspect 
        ? Math.floor(Math.random() * 4) + 17 // 17-20
        : isKeyStar 
        ? Math.floor(Math.random() * 6) + 24 // 24-29
        : isStarter
        ? Math.floor(Math.random() * 8) + 22 // 22-29
        : Math.floor(Math.random() * 10) + 22; // 22-31

      // -------------------------------------------------------------
      // REALISTIC RATING CALIBRATION BASED ON CLUB REPUTATION & TIER
      // -------------------------------------------------------------
      let baseRating: number;
      const rep = club.reputation;

      if (rep >= 92) {
        // Top 10 World Superclubs (Man City, Real Madrid, Bayern, PSG)
        baseRating = isKeyStar 
          ? (Math.random() < 0.35 ? 88 + Math.floor(Math.random() * 3) : 85 + Math.floor(Math.random() * 3))
          : isStarter 
          ? 79 + Math.floor(Math.random() * 6) // 79-84
          : isRotation 
          ? 74 + Math.floor(Math.random() * 5) // 74-78
          : 64 + Math.floor(Math.random() * 7); // 64-70
      } else if (rep >= 84) {
        // Elite European / Big League Contenders (Arsenal, Dortmund, Inter, Atletico)
        baseRating = isKeyStar 
          ? (Math.random() < 0.20 ? 86 + Math.floor(Math.random() * 3) : 82 + Math.floor(Math.random() * 4))
          : isStarter 
          ? 76 + Math.floor(Math.random() * 6) // 76-81
          : isRotation 
          ? 71 + Math.floor(Math.random() * 5) // 71-75
          : 62 + Math.floor(Math.random() * 7); // 62-68
      } else if (rep >= 75) {
        // Mid-Table Top Flight Clubs
        baseRating = isKeyStar 
          ? 78 + Math.floor(Math.random() * 5) // 78-82
          : isStarter 
          ? 72 + Math.floor(Math.random() * 5) // 72-76
          : isRotation 
          ? 67 + Math.floor(Math.random() * 5) // 67-71
          : 58 + Math.floor(Math.random() * 7); // 58-64
      } else if (rep >= 62) {
        // Lower Top Flight / High Tier 2 Clubs
        baseRating = isKeyStar 
          ? 73 + Math.floor(Math.random() * 5) // 73-77
          : isStarter 
          ? 66 + Math.floor(Math.random() * 6) // 66-71
          : isRotation 
          ? 61 + Math.floor(Math.random() * 5) // 61-65
          : 53 + Math.floor(Math.random() * 7); // 53-59
      } else {
        // Tier 2 & Emerging League Clubs
        baseRating = isKeyStar 
          ? 67 + Math.floor(Math.random() * 5) // 67-71
          : isStarter 
          ? 60 + Math.floor(Math.random() * 6) // 60-65
          : isRotation 
          ? 55 + Math.floor(Math.random() * 5) // 55-59
          : 48 + Math.floor(Math.random() * 7); // 48-54
      }

      const rating = Math.max(48, Math.min(94, baseRating));

      // -------------------------------------------------------------
      // REALISTIC POTENTIAL GENERATION
      // -------------------------------------------------------------
      let potential: number;
      let potentialRealizationRate = Number((0.75 + Math.random() * 0.30).toFixed(2)); // 0.75 to 1.05

      if (age <= 21) {
        // Youngsters have a realistic bell curve:
        const roll = Math.random();
        if (roll < 0.50) {
          // 50% modest potential (squad filler / lower league)
          potential = rating + Math.floor(Math.random() * 5) + 3; // +3 to +7
        } else if (roll < 0.80) {
          // 30% decent potential (solid pro)
          potential = Math.min(82, rating + Math.floor(Math.random() * 6) + 6); // +6 to +11
        } else if (roll < 0.95) {
          // 15% high potential (top flight starter)
          potential = Math.min(87, rating + Math.floor(Math.random() * 8) + 8); // +8 to +15
        } else if (roll < 0.99) {
          // 4% genuine Wonderkid
          potential = Math.min(92, rating + Math.floor(Math.random() * 10) + 12); // +12 to +21
        } else {
          // 1% Generational Prodigy
          potential = Math.min(95, rating + Math.floor(Math.random() * 10) + 16);
          potentialRealizationRate = 1.05;
        }
      } else if (age <= 25) {
        // Prime development window
        potential = Math.max(rating, rating + Math.floor(Math.random() * 4));
      } else {
        // Established veteran - potential equals current rating
        potential = rating;
      }

      // -------------------------------------------------------------
      // REGIONALLY APPROPRIATE NATIONALITY & NAMES
      // -------------------------------------------------------------
      // Foreign player roll: 25% for top 5 European leagues, 10% for other leagues
      const isTopEuropeanLeague = ['eng_pl', 'esp_ll', 'ita_sa', 'ger_bl', 'fra_l1'].includes(leagueDef.id);
      const isForeign = Math.random() < (isTopEuropeanLeague ? 0.35 : 0.12);
      
      const identity = generateRegionalPlayerIdentity(leagueDef, isForeign);
      const agencyName = AGENCIES[(pCount + i) % AGENCIES.length];
      const val = calculateValuationForRating(rating, age, potential);

      const isWonderkid = potential >= 88 && age <= 21;
      const isStar = rating >= 82;

      // Assign Potential Volatility & Realization Chance (Ensures high potential does NOT guarantee elite status!)
      const volData = assignPotentialVolatilityAndRealization(age, rating, potential);

      const playerObj: Player = {
        id: `pl_gen_${pCount++}`,
        name: `${identity.firstName} ${identity.lastName}`,
        age,
        nationality: identity.nationality,
        flag: identity.flag,
        position: pos,
        rating,
        potential,
        potentialCeiling: potential,
        potentialVolatility: volData.volatility,
        realizationChance: volData.realizationChance,
        actualPotentialLimit: volData.actualPotentialLimit,
        potentialRealizationRate: volData.realizationRate,
        realizationStatus: 'on_track',
        condition: Math.floor(Math.random() * 15) + 85, // 85-100%
        matchFitness: Math.floor(Math.random() * 15) + 85,
        adaptationWeeksRemaining: isForeign ? Math.floor(Math.random() * 8) + 4 : 0,
        yellowCards: 0,
        redCards: 0,
        isSuspended: false,
        suspensionMatchesRemaining: 0,
        value: val,
        wage: Math.round(Math.pow(rating / 50, 3.2) * 1200),
        contractYears: Math.floor(Math.random() * 4) + 1,
        clubId: club.id,
        clubName: club.name,
        agencyName,
        agencyLoyalty: Math.floor(Math.random() * 30) + 60,
        isMyClient: false,
        agentCommission: 10,
        isRegistered: true,
        isHomegrown: !isForeign || isWonderkid || Math.random() < 0.45,
        unregisteredWeeks: 0,
        agreedPlayingTime: isKeyStar ? 'Star Player' : rating >= 78 ? 'Important Starter' : rating >= 72 ? 'Regular Starter' : isYouthProspect ? 'Youth Prospect' : 'Squad Rotation',
        playingTimeSatisfaction: 85,
        consecutiveWeeksBenched: 0,
        consecutiveBadFormWeeks: 0,
        consecutiveGoodFormWeeks: 0,
        consecutiveUnregisteredWeeks: 0,
        homesickWeeks: 0,
        morale: Math.floor(Math.random() * 20) + 75,
        loyalty: Math.floor(Math.random() * 25) + 70,
        form: Math.floor(Math.random() * 20) + 75,
        injury: { isInjured: false, weeks: 0 },
        traits: [
          isWonderkid ? 'Wonderkid Prospect' : isStar ? 'World Class Star' : 'Squad Rotation',
          volData.volatility === 'boom_or_bust' ? 'High Risk / High Reward' : volData.volatility === 'late_bloomer' ? 'Late Bloomer Arc' : 'Technical Specialist'
        ],
        stats: { goals: Math.floor(Math.random() * 4), assists: Math.floor(Math.random() * 4), appearances: Math.floor(Math.random() * 12), avgRating: Number((6.8 + Math.random() * 0.8).toFixed(1)) },
        clauses: { releaseClause: Math.round(val * 1.5) },
        personalLife: { happiness: 85, socialMediaFollowers: rating * 8000, scandalLevel: 5, endorsementEarnings: rating * 400 },
        avatarSeed: { skinTone: '#f8d5c2', hairStyle: 'short', hairColor: '#2c1e19', eyeColor: '#1a100c' },
        biography: `${identity.firstName} ${identity.lastName} developed through regional academies before establishing himself at ${club.name}. Known for consistent tactical discipline.`,
        careerHistory: [
          { season: '2025/26', clubName: club.name, appearances: Math.floor(Math.random() * 12) + 2, goals: Math.floor(Math.random() * 4), assists: Math.floor(Math.random() * 3), transferFee: 'Current Squad' }
        ]
      };

      generatedNonInitialPlayers.push(playerObj);
    }
  });

  // -------------------------------------------------------------
  // GLOBAL RATING NORMALIZATION (Guarantees exactly ~5% are 88-95)
  // -------------------------------------------------------------
  const allCombined = [...players, ...generatedNonInitialPlayers];
  const totalCount = allCombined.length;
  const targetEliteCount = Math.round(totalCount * 0.05); // Target 5% in 88-95 range

  // Sort generated players by rating descending
  generatedNonInitialPlayers.sort((a, b) => b.rating - a.rating);

  // Initial players who are already >= 88
  const initialEliteCount = players.filter(p => p.rating >= 88).length;
  const remainingEliteSlots = Math.max(0, targetEliteCount - initialEliteCount);

  // Set top remainingEliteSlots to 88-91 (with top ~15 reaching 90-92)
  for (let idx = 0; idx < generatedNonInitialPlayers.length; idx++) {
    const p = generatedNonInitialPlayers[idx];
    if (idx < remainingEliteSlots) {
      if (idx < Math.min(20, Math.round(totalCount * 0.006))) {
        p.rating = 90 + (idx % 3); // 90-92 for world superstars
      } else {
        p.rating = 88 + (idx % 2); // 88-89 for world class
      }
      p.potential = Math.max(p.rating, p.potential);
      p.value = calculateValuationForRating(p.rating, p.age, p.potential);
    } else if (p.rating >= 88) {
      // Scale down any excess players above 87 to ensure strictly 5% cap!
      p.rating = 84 + (idx % 4); // 84-87
      p.potential = Math.max(p.rating, Math.min(89, p.potential));
      p.value = calculateValuationForRating(p.rating, p.age, p.potential);
    }
  }

  return [...players, ...generatedNonInitialPlayers];
}

export function enforceSquadMinRoster(clubs: Club[], existingPlayers: Player[]): Player[] {
  const updatedPlayers = [...existingPlayers];
  let autoYouthCount = 1;

  const leagueMap = new Map<string, LeagueDef>();
  CONTINENTAL_LEAGUES.forEach(l => {
    leagueMap.set(l.name, l);
    if (l.id === 'usa_mls') leagueMap.set('MLS', l);
  });

  const clubCountMap = new Map<string, number>();
  existingPlayers.forEach(p => {
    if (p.clubId) {
      clubCountMap.set(p.clubId, (clubCountMap.get(p.clubId) || 0) + 1);
    }
  });

  clubs.forEach((club) => {
    const clubPlayerCount = clubCountMap.get(club.id) || 0;
    const minRosterTarget = 16;
    const leagueDef = leagueMap.get(club.league) || CONTINENTAL_LEAGUES[0];

    if (clubPlayerCount < minRosterTarget) {
      const needed = minRosterTarget - clubPlayerCount;
      const squadPositions: Position[] = ['GK', 'CB', 'LB', 'RB', 'CM', 'CAM', 'RW', 'LW', 'ST'];

      for (let k = 0; k < needed; k++) {
        const pos = squadPositions[(k + autoYouthCount) % squadPositions.length];
        const identity = generateRegionalPlayerIdentity(leagueDef, false);
        const age = Math.floor(Math.random() * 3) + 17; // 17-19
        const rating = Math.min(68, Math.max(50, club.reputation - 22 + Math.floor(Math.random() * 8)));
        
        // Realistic youth potential:
        const roll = Math.random();
        const potential = roll < 0.60 
          ? rating + Math.floor(Math.random() * 6) + 4 // +4 to +9
          : roll < 0.90
          ? Math.min(80, rating + Math.floor(Math.random() * 6) + 8) // +8 to +13
          : Math.min(88, rating + Math.floor(Math.random() * 8) + 12); // +12 to +19

        const volData = assignPotentialVolatilityAndRealization(age, rating, potential);
        const agencyName = AGENCIES[(k + autoYouthCount) % AGENCIES.length];

        updatedPlayers.push({
          id: `youth_${club.id}_${Date.now()}_${autoYouthCount++}`,
          name: `${identity.firstName} ${identity.lastName} (Youth)`,
          age,
          nationality: identity.nationality,
          flag: identity.flag,
          position: pos,
          rating,
          potential,
          potentialCeiling: potential,
          potentialVolatility: volData.volatility,
          realizationChance: volData.realizationChance,
          actualPotentialLimit: volData.actualPotentialLimit,
          potentialRealizationRate: volData.realizationRate,
          realizationStatus: 'on_track',
          condition: 100,
          matchFitness: 90,
          yellowCards: 0,
          redCards: 0,
          isSuspended: false,
          suspensionMatchesRemaining: 0,
          value: calculateValuationForRating(rating, age, potential),
          wage: Math.round(rating * 350),
          contractYears: 3,
          clubId: club.id,
          clubName: club.name,
          agencyName,
          agencyLoyalty: 85,
          isAutoYouthPromoted: true,
          isHomegrown: true,
          isRegistered: true,
          unregisteredWeeks: 0,
          agreedPlayingTime: 'Youth Prospect',
          playingTimeSatisfaction: 85,
          consecutiveWeeksBenched: 0,
          consecutiveBadFormWeeks: 0,
          consecutiveGoodFormWeeks: 0,
          consecutiveUnregisteredWeeks: 0,
          homesickWeeks: 0,
          isMyClient: false,
          agentCommission: 8,
          morale: 80,
          loyalty: 85,
          form: 75,
          injury: { isInjured: false, weeks: 0 },
          traits: ['Academy Graduate', 'Youth Prospect'],
          stats: { goals: 0, assists: 0, appearances: 0, avgRating: 6.8 },
          clauses: { releaseClause: Math.round(rating * rating * 25000) },
          personalLife: { happiness: 85, socialMediaFollowers: 2500, scandalLevel: 0, endorsementEarnings: 0 }
        });
      }
    }
  });

  return updatedPlayers;
}

export function generateRivalAgentsList(): RivalAgent[] {
  return [
    {
      id: 'ra1',
      name: 'Jorge Mendez-Style',
      agencyName: 'Gestifute Global',
      influence: 98,
      relationship: -20,
      topClients: ['Cristiano Ronaldo', 'Bernardo Silva', 'Ruben Dias'],
      strategy: 'Financial Mogul',
      avatarColor: 'bg-amber-600',
      headquarters: 'Lisbon & London'
    },
    {
      id: 'ra2',
      name: 'Rafaela Pimenta-Style',
      agencyName: 'OneSGM Empire',
      influence: 94,
      relationship: 10,
      topClients: ['Erling Haaland', 'Matthijs de Ligt'],
      strategy: 'Diplomatic Dealmaker',
      avatarColor: 'bg-purple-600',
      headquarters: 'Monaco & Zurich'
    },
    {
      id: 'ra3',
      name: 'Jonathan Barnett-Style',
      agencyName: 'Stellar Football Group',
      influence: 89,
      relationship: -40,
      topClients: ['Eduardo Camavinga', 'Jack Grealish'],
      strategy: 'Aggressive Poacher',
      avatarColor: 'bg-blue-600',
      headquarters: 'London & Madrid'
    },
    {
      id: 'ra4',
      name: 'Pini Zahavi-Style',
      agencyName: 'Gol International Shadow Agency',
      influence: 91,
      relationship: -10,
      topClients: ['Robert Lewandowski', 'Christopher Nkunku'],
      strategy: 'Shadow Media Operator',
      avatarColor: 'bg-red-600',
      headquarters: 'Tel Aviv & Paris'
    },
    {
      id: 'ra5',
      name: 'Giuffrida Brothers',
      agencyName: 'Calcio Syndicate',
      influence: 82,
      relationship: 15,
      topClients: ['Giacomo Raspadori', 'Gianluca Scamacca'],
      strategy: 'Diplomatic Dealmaker',
      avatarColor: 'bg-emerald-600',
      headquarters: 'Milan & Rome'
    },
    {
      id: 'ra6',
      name: 'South American Talent Syndicate',
      agencyName: 'Samba Stars Group',
      influence: 86,
      relationship: 25,
      topClients: ['Endrick Felipe', 'Vitor Roque'],
      strategy: 'Aggressive Poacher',
      avatarColor: 'bg-yellow-500',
      headquarters: 'Sao Paulo & Buenos Aires'
    }
  ];
}

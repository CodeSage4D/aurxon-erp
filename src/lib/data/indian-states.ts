/**
 * Master Indian States and Union Territories with Major Cities & Districts
 * Standardized for school registration, student profiles, and address validation in AURXON ERP.
 */

export interface StateInfo {
  code: string;
  name: string;
  type: 'STATE' | 'UT';
  cities: string[];
}

export const INDIAN_STATES_AND_UTS: StateInfo[] = [
  {
    code: 'AN',
    name: 'Andaman & Nicobar Islands',
    type: 'UT',
    cities: ['Port Blair', 'Car Nicobar', 'Mayabunder', 'Diglipur'],
  },
  {
    code: 'AP',
    name: 'Andhra Pradesh',
    type: 'STATE',
    cities: ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Tirupati', 'Kakinada', 'Rajahmundry'],
  },
  {
    code: 'AR',
    name: 'Arunachal Pradesh',
    type: 'STATE',
    cities: ['Itanagar', 'Naharlagun', 'Pasighat', 'Tawang', 'Ziro'],
  },
  {
    code: 'AS',
    name: 'Assam',
    type: 'STATE',
    cities: ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tezpur'],
  },
  {
    code: 'BR',
    name: 'Bihar',
    type: 'STATE',
    cities: ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnea', 'Darbhanga', 'Bihar Sharif', 'Arrah'],
  },
  {
    code: 'CH',
    name: 'Chandigarh',
    type: 'UT',
    cities: ['Chandigarh'],
  },
  {
    code: 'CG',
    name: 'Chhattisgarh',
    type: 'STATE',
    cities: ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Rajnandgaon', 'Jagdalpur'],
  },
  {
    code: 'DN',
    name: 'Dadra & Nagar Haveli and Daman & Diu',
    type: 'UT',
    cities: ['Daman', 'Diu', 'Silvassa'],
  },
  {
    code: 'DL',
    name: 'Delhi NCR',
    type: 'UT',
    cities: ['New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi', 'Central Delhi', 'Noida', 'Gurugram', 'Faridabad', 'Ghaziabad'],
  },
  {
    code: 'GA',
    name: 'Goa',
    type: 'STATE',
    cities: ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda'],
  },
  {
    code: 'GJ',
    name: 'Gujarat',
    type: 'STATE',
    cities: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar', 'Junagadh', 'Anand'],
  },
  {
    code: 'HR',
    name: 'Haryana',
    type: 'STATE',
    cities: ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Karnal', 'Hisar', 'Panchkula'],
  },
  {
    code: 'HP',
    name: 'Himachal Pradesh',
    type: 'STATE',
    cities: ['Shimla', 'Dharamshala', 'Mandi', 'Solan', 'Kullu', 'Hamirpur', 'Bilaspur'],
  },
  {
    code: 'JK',
    name: 'Jammu & Kashmir',
    type: 'UT',
    cities: ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Udhampur'],
  },
  {
    code: 'JH',
    name: 'Jharkhand',
    type: 'STATE',
    cities: ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Hazaribagh', 'Deoghar'],
  },
  {
    code: 'KA',
    name: 'Karnataka',
    type: 'STATE',
    cities: ['Bengaluru', 'Mysuru', 'Hubballi-Dharwad', 'Mangaluru', 'Belagavi', 'Kalaburagi', 'Ballari', 'Davangere', 'Shivamogga'],
  },
  {
    code: 'KL',
    name: 'Kerala',
    type: 'STATE',
    cities: ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Palakkad', 'Kannur', 'Alappuzha'],
  },
  {
    code: 'LA',
    name: 'Ladakh',
    type: 'UT',
    cities: ['Leh', 'Kargil'],
  },
  {
    code: 'LD',
    name: 'Lakshadweep',
    type: 'UT',
    cities: ['Kavaratti', 'Agatti', 'Amini'],
  },
  {
    code: 'MP',
    name: 'Madhya Pradesh',
    type: 'STATE',
    cities: ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Dewas', 'Satna', 'Ratlam'],
  },
  {
    code: 'MH',
    name: 'Maharashtra',
    type: 'STATE',
    cities: ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Kalyan-Dombivli', 'Vasai-Virar', 'Aurangabad (Chhatrapati Sambhaji Nagar)', 'Solapur', 'Amravati', 'Kolhapur', 'Navi Mumbai'],
  },
  {
    code: 'MN',
    name: 'Manipur',
    type: 'STATE',
    cities: ['Imphal', 'Churachandpur', 'Thoubal'],
  },
  {
    code: 'ML',
    name: 'Meghalaya',
    type: 'STATE',
    cities: ['Shillong', 'Tura', 'Jowai'],
  },
  {
    code: 'MZ',
    name: 'Mizoram',
    type: 'STATE',
    cities: ['Aizawl', 'Lunglei', 'Champhai'],
  },
  {
    code: 'NL',
    name: 'Nagaland',
    type: 'STATE',
    cities: ['Kohima', 'Dimapur', 'Mokokchung'],
  },
  {
    code: 'OD',
    name: 'Odisha',
    type: 'STATE',
    cities: ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri', 'Balasore'],
  },
  {
    code: 'PY',
    name: 'Puducherry',
    type: 'UT',
    cities: ['Puducherry', 'Karaikal', 'Mahe', 'Yanam'],
  },
  {
    code: 'PB',
    name: 'Punjab',
    type: 'STATE',
    cities: ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali (SAS Nagar)', 'Pathankot', 'Hoshiarpur'],
  },
  {
    code: 'RJ',
    name: 'Rajasthan',
    type: 'STATE',
    cities: ['Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur', 'Bhilwara', 'Alwar', 'Sikar'],
  },
  {
    code: 'SK',
    name: 'Sikkim',
    type: 'STATE',
    cities: ['Gangtok', 'Namchi', 'Gyalshing'],
  },
  {
    code: 'TN',
    name: 'Tamil Nadu',
    type: 'STATE',
    cities: ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tiruppur', 'Erode', 'Vellore', 'Tirunelveli'],
  },
  {
    code: 'TS',
    name: 'Telangana',
    type: 'STATE',
    cities: ['Hyderabad', 'Warangal', 'Nizamabad', 'Khammam', 'Karimnagar', 'Ramagundam'],
  },
  {
    code: 'TR',
    name: 'Tripura',
    type: 'STATE',
    cities: ['Agartala', 'Udaipur', 'Dharmanagar'],
  },
  {
    code: 'UP',
    name: 'Uttar Pradesh',
    type: 'STATE',
    cities: ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi', 'Meerut', 'Prayagraj (Allahabad)', 'Noida', 'Bareilly', 'Aligarh', 'Moradabad', 'Saharanpur', 'Gorakhpur'],
  },
  {
    code: 'UK',
    name: 'Uttarakhand',
    type: 'STATE',
    cities: ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rudraprayag', 'Nainital', 'Rishikesh'],
  },
  {
    code: 'WB',
    name: 'West Bengal',
    type: 'STATE',
    cities: ['Kolkata', 'Howrah', 'Asansol', 'Siliguri', 'Durgapur', 'Bardhaman', 'Malda', 'Kharagpur'],
  },
];

export const ALL_INDIAN_STATE_NAMES = INDIAN_STATES_AND_UTS.map((s) => s.name);

/**
 * NAICS (North American Industry Classification System) — 3-digit subsector codes.
 * Texas-prominent industries flagged for priority display.
 */

export interface NaicsCode {
  code: string;
  label: string;
  sector: string;
  texasFocus?: boolean;
}

export const NAICS_CODES: NaicsCode[] = [
  // ── Texas Focus (surfaced first in search) ────────────────────────────
  { code: '211', label: 'Oil & Gas Extraction', sector: 'Mining & Oil/Gas', texasFocus: true },
  { code: '324', label: 'Petroleum & Coal Products Manufacturing', sector: 'Manufacturing', texasFocus: true },
  { code: '213', label: 'Support Activities for Mining & Oil/Gas', sector: 'Mining & Oil/Gas', texasFocus: true },
  { code: '541', label: 'Professional, Scientific & Technical Services', sector: 'Professional Services', texasFocus: true },
  { code: '621', label: 'Ambulatory Health Care Services', sector: 'Health Care', texasFocus: true },
  { code: '622', label: 'Hospitals', sector: 'Health Care', texasFocus: true },
  { code: '236', label: 'Construction of Buildings', sector: 'Construction', texasFocus: true },
  { code: '237', label: 'Heavy & Civil Engineering Construction', sector: 'Construction', texasFocus: true },
  { code: '238', label: 'Specialty Trade Contractors', sector: 'Construction', texasFocus: true },
  { code: '484', label: 'Truck Transportation', sector: 'Transportation', texasFocus: true },
  { code: '493', label: 'Warehousing & Storage', sector: 'Transportation', texasFocus: true },
  { code: '531', label: 'Real Estate', sector: 'Real Estate', texasFocus: true },
  { code: '336', label: 'Transportation Equipment Manufacturing', sector: 'Manufacturing', texasFocus: true },
  { code: '334', label: 'Computer & Electronic Product Manufacturing', sector: 'Manufacturing', texasFocus: true },
  { code: '221', label: 'Utilities (Electric, Gas, Water)', sector: 'Utilities', texasFocus: true },
  { code: '111', label: 'Crop Production', sector: 'Agriculture', texasFocus: true },
  { code: '112', label: 'Animal Production & Aquaculture', sector: 'Agriculture', texasFocus: true },
  { code: '522', label: 'Credit Intermediation & Related Activities', sector: 'Finance', texasFocus: true },
  { code: '524', label: 'Insurance Carriers & Related Activities', sector: 'Finance', texasFocus: true },
  { code: '516', label: 'Computing Infrastructure & Data Processing', sector: 'Information', texasFocus: true },
  { code: '921', label: 'Executive, Legislative & General Government', sector: 'Public Administration', texasFocus: true },
  { code: '611', label: 'Educational Services', sector: 'Education', texasFocus: true },

  // ── Agriculture, Forestry, Fishing & Hunting (11) ─────────────────────
  { code: '113', label: 'Forestry & Logging', sector: 'Agriculture' },
  { code: '114', label: 'Fishing, Hunting & Trapping', sector: 'Agriculture' },
  { code: '115', label: 'Support Activities for Agriculture & Forestry', sector: 'Agriculture' },

  // ── Mining, Quarrying & Oil/Gas Extraction (21) ───────────────────────
  { code: '212', label: 'Mining (except Oil & Gas)', sector: 'Mining & Oil/Gas' },

  // ── Manufacturing (31-33) ─────────────────────────────────────────────
  { code: '311', label: 'Food Manufacturing', sector: 'Manufacturing' },
  { code: '312', label: 'Beverage & Tobacco Product Manufacturing', sector: 'Manufacturing' },
  { code: '313', label: 'Textile Mills', sector: 'Manufacturing' },
  { code: '314', label: 'Textile Product Mills', sector: 'Manufacturing' },
  { code: '315', label: 'Apparel Manufacturing', sector: 'Manufacturing' },
  { code: '316', label: 'Leather & Allied Product Manufacturing', sector: 'Manufacturing' },
  { code: '321', label: 'Wood Product Manufacturing', sector: 'Manufacturing' },
  { code: '322', label: 'Paper Manufacturing', sector: 'Manufacturing' },
  { code: '323', label: 'Printing & Related Support Activities', sector: 'Manufacturing' },
  { code: '325', label: 'Chemical Manufacturing', sector: 'Manufacturing' },
  { code: '326', label: 'Plastics & Rubber Products Manufacturing', sector: 'Manufacturing' },
  { code: '327', label: 'Nonmetallic Mineral Product Manufacturing', sector: 'Manufacturing' },
  { code: '331', label: 'Primary Metal Manufacturing', sector: 'Manufacturing' },
  { code: '332', label: 'Fabricated Metal Product Manufacturing', sector: 'Manufacturing' },
  { code: '333', label: 'Machinery Manufacturing', sector: 'Manufacturing' },
  { code: '335', label: 'Electrical Equipment & Component Manufacturing', sector: 'Manufacturing' },
  { code: '337', label: 'Furniture & Related Product Manufacturing', sector: 'Manufacturing' },
  { code: '339', label: 'Miscellaneous Manufacturing', sector: 'Manufacturing' },

  // ── Wholesale Trade (42) ──────────────────────────────────────────────
  { code: '423', label: 'Merchant Wholesalers, Durable Goods', sector: 'Wholesale Trade' },
  { code: '424', label: 'Merchant Wholesalers, Nondurable Goods', sector: 'Wholesale Trade' },
  { code: '425', label: 'Wholesale Trade Agents & Brokers', sector: 'Wholesale Trade' },

  // ── Retail Trade (44-45) ──────────────────────────────────────────────
  { code: '441', label: 'Motor Vehicle & Parts Dealers', sector: 'Retail Trade' },
  { code: '442', label: 'Furniture & Home Furnishings Retailers', sector: 'Retail Trade' },
  { code: '443', label: 'Electronics & Appliance Retailers', sector: 'Retail Trade' },
  { code: '444', label: 'Building Material & Garden Equipment Retailers', sector: 'Retail Trade' },
  { code: '445', label: 'Food & Beverage Retailers', sector: 'Retail Trade' },
  { code: '446', label: 'Health & Personal Care Retailers', sector: 'Retail Trade' },
  { code: '447', label: 'Gasoline Stations & Fuel Dealers', sector: 'Retail Trade' },
  { code: '448', label: 'Clothing & Accessories Retailers', sector: 'Retail Trade' },
  { code: '449', label: 'Sporting Goods, Hobby & Musical Retailers', sector: 'Retail Trade' },
  { code: '452', label: 'General Merchandise Retailers', sector: 'Retail Trade' },
  { code: '453', label: 'Miscellaneous Store Retailers', sector: 'Retail Trade' },
  { code: '454', label: 'Nonstore Retailers (e-commerce)', sector: 'Retail Trade' },

  // ── Transportation & Warehousing (48-49) ──────────────────────────────
  { code: '481', label: 'Air Transportation', sector: 'Transportation' },
  { code: '482', label: 'Rail Transportation', sector: 'Transportation' },
  { code: '483', label: 'Water Transportation', sector: 'Transportation' },
  { code: '485', label: 'Transit & Ground Passenger Transportation', sector: 'Transportation' },
  { code: '486', label: 'Pipeline Transportation', sector: 'Transportation' },
  { code: '487', label: 'Scenic & Sightseeing Transportation', sector: 'Transportation' },
  { code: '488', label: 'Support Activities for Transportation', sector: 'Transportation' },
  { code: '491', label: 'Postal Service', sector: 'Transportation' },
  { code: '492', label: 'Couriers & Messengers', sector: 'Transportation' },

  // ── Information (51) ──────────────────────────────────────────────────
  { code: '511', label: 'Publishing Industries', sector: 'Information' },
  { code: '512', label: 'Motion Picture & Sound Recording', sector: 'Information' },
  { code: '513', label: 'Broadcasting & Content Providers', sector: 'Information' },
  { code: '517', label: 'Telecommunications', sector: 'Information' },
  { code: '519', label: 'Web Search Portals, Libraries & Archives', sector: 'Information' },

  // ── Finance & Insurance (52) ──────────────────────────────────────────
  { code: '521', label: 'Monetary Authorities — Central Bank', sector: 'Finance' },
  { code: '523', label: 'Securities, Commodities & Financial Investments', sector: 'Finance' },
  { code: '525', label: 'Funds, Trusts & Other Financial Vehicles', sector: 'Finance' },

  // ── Real Estate & Rental (53) ─────────────────────────────────────────
  { code: '532', label: 'Rental & Leasing Services', sector: 'Real Estate' },
  { code: '533', label: 'Lessors of Nonfinancial Intangible Assets', sector: 'Real Estate' },

  // ── Management of Companies (55) ──────────────────────────────────────
  { code: '551', label: 'Management of Companies & Enterprises', sector: 'Management' },

  // ── Administrative & Waste Management (56) ────────────────────────────
  { code: '561', label: 'Administrative & Support Services', sector: 'Administrative' },
  { code: '562', label: 'Waste Management & Remediation Services', sector: 'Administrative' },

  // ── Health Care & Social Assistance (62) ──────────────────────────────
  { code: '623', label: 'Nursing & Residential Care Facilities', sector: 'Health Care' },
  { code: '624', label: 'Social Assistance', sector: 'Health Care' },

  // ── Arts, Entertainment & Recreation (71) ─────────────────────────────
  { code: '711', label: 'Performing Arts, Spectator Sports & Related', sector: 'Arts & Entertainment' },
  { code: '712', label: 'Museums, Historical Sites & Similar', sector: 'Arts & Entertainment' },
  { code: '713', label: 'Amusement, Gambling & Recreation', sector: 'Arts & Entertainment' },

  // ── Accommodation & Food Services (72) ────────────────────────────────
  { code: '721', label: 'Accommodation', sector: 'Hospitality' },
  { code: '722', label: 'Food Services & Drinking Places', sector: 'Hospitality' },

  // ── Other Services (81) ───────────────────────────────────────────────
  { code: '811', label: 'Repair & Maintenance', sector: 'Other Services' },
  { code: '812', label: 'Personal & Laundry Services', sector: 'Other Services' },
  { code: '813', label: 'Religious, Civic & Professional Organizations', sector: 'Other Services' },
  { code: '814', label: 'Private Households', sector: 'Other Services' },

  // ── Public Administration (92) ────────────────────────────────────────
  { code: '922', label: 'Justice, Public Order & Safety', sector: 'Public Administration' },
  { code: '923', label: 'Administration of Human Resource Programs', sector: 'Public Administration' },
  { code: '924', label: 'Administration of Environmental Quality Programs', sector: 'Public Administration' },
  { code: '925', label: 'Housing, Urban Planning & Community Development', sector: 'Public Administration' },
  { code: '926', label: 'Administration of Economic Programs', sector: 'Public Administration' },
  { code: '927', label: 'Space Research & Technology', sector: 'Public Administration' },
  { code: '928', label: 'National Security & International Affairs', sector: 'Public Administration' },
];

/** Look up a NAICS code's display label */
export function getNaicsLabel(code: string): string {
  const entry = NAICS_CODES.find((n) => n.code === code);
  return entry ? `${entry.code} — ${entry.label}` : code;
}

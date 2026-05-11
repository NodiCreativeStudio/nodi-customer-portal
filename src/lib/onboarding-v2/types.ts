export type CampoTipo = "text" | "textarea" | "number" | "select" | "checkbox";

export interface Campo {
  id: string;
  label: string;
  tipo: CampoTipo;
  obbligatorio?: boolean;
  rows?: number;
  opzioni?: string[];
}

export interface Sezione {
  id: string;
  nome: string;
  campi: Campo[];
}

export interface Pagina {
  numero: number;
  titolo: string;
  sezioni: Sezione[];
}

export interface VerticaleConfig {
  verticale: "retail" | "wellness" | "repair";
  nome_verticale: string;
  colore: string;
  icona: string;
  descrizione: string;
  pagine: Pagina[];
}

export interface Anagrafica {
  ragione_sociale: string;
  insegna: string;
  partita_iva: string;
  sdi: string;
  indirizzo: string;
  comune: string;
  provincia: string;
  cap: string;
  email: string;
  pec: string;
  telefono: string;
  nome_referente: string;
  email_referente: string;
  telefono_referente: string;
  ruolo_referente: string;
}

export const emptyAnagrafica: Anagrafica = {
  ragione_sociale: "", insegna: "", partita_iva: "", sdi: "",
  indirizzo: "", comune: "", provincia: "", cap: "",
  email: "", pec: "", telefono: "",
  nome_referente: "", email_referente: "", telefono_referente: "", ruolo_referente: "",
};

export const anagraficaFields: { id: keyof Anagrafica; label: string; required: boolean; type?: string }[] = [
  { id: "ragione_sociale", label: "Ragione Sociale", required: true },
  { id: "insegna", label: "Insegna Commerciale", required: false },
  { id: "partita_iva", label: "Partita IVA", required: true },
  { id: "sdi", label: "SDI", required: false },
  { id: "indirizzo", label: "Indirizzo", required: true },
  { id: "comune", label: "Comune", required: true },
  { id: "provincia", label: "Provincia", required: true },
  { id: "cap", label: "CAP", required: true },
  { id: "email", label: "Email", required: true, type: "email" },
  { id: "pec", label: "PEC", required: false, type: "email" },
  { id: "telefono", label: "Telefono", required: true, type: "tel" },
  { id: "nome_referente", label: "Nome Referente", required: true },
  { id: "email_referente", label: "Email Referente", required: true, type: "email" },
  { id: "telefono_referente", label: "Telefono Referente", required: true, type: "tel" },
  { id: "ruolo_referente", label: "Ruolo Referente", required: true },
];

import { z } from 'zod';

export const newClientSchema = z.object({
  firmenname: z.string().min(2),
  rechtsform: z.string().min(2),
  rechtsformSonstige: z.string().optional().or(z.literal('')),
  gruendungsdatum: z.string().optional().or(z.literal('')),
  branche: z.string().min(2),
  taetigkeit: z.string().optional().or(z.literal('')),
  website: z.string().optional().or(z.literal('')),
  strasse: z.string().min(2),
  plz: z.string().min(4),
  ort: z.string().min(2),
  land: z.string().min(2),

  ansprechpartnerVorname: z.string().min(2),
  ansprechpartnerNachname: z.string().min(2),
  ansprechpartnerPosition: z.string().min(2),
  email: z.string().email(),
  telefon: z.string().min(5),

  unternehmensnummer: z.string().optional().or(z.literal('')),
  betriebsnummer: z.string().min(2),
  bgPin: z.string().optional().or(z.literal('')),

  steuernummer: z.string().optional().or(z.literal('')),
  ustid: z.string().optional().or(z.literal('')),
  handelsregisterVorhanden: z.enum(['Ja', 'Nein']),
  handelsregisternummer: z.string().optional().or(z.literal('')),
  registergericht: z.string().optional().or(z.literal('')),
  mitarbeiterzahl: z.string().optional().or(z.literal('')),

  inhaber1: z.string().optional().or(z.literal('')),
  inhaber2: z.string().optional().or(z.literal('')),
  gesellschafter1: z.string().optional().or(z.literal('')),
  gesellschafter2: z.string().optional().or(z.literal('')),
  geschaeftsfuehrer1: z.string().optional().or(z.literal('')),
  geschaeftsfuehrer2: z.string().optional().or(z.literal('')),

  fibuGewuenscht: z.enum(['Ja', 'Nein']),
  fibuAb: z.string().optional().or(z.literal('')),
  lohnGewuenscht: z.enum(['Ja', 'Nein']),
  lohnAb: z.string().optional().or(z.literal('')),
  lohnMitarbeiterzahl: z.string().optional().or(z.literal('')),
  jahresabschlussGewuenscht: z.enum(['Ja', 'Nein']),
  steuererklaerungenGewuenscht: z.enum(['Ja', 'Nein']),
  sonstigeBeratungGewuenscht: z.enum(['Ja', 'Nein']),
  sonstigeBeratungText: z.string().optional().or(z.literal('')),
  dringlichkeit: z.enum(['sofort', 'innerhalb 1 Monat', 'geplant']),

  ustPflichtig: z.enum(['Ja', 'Nein']),
  ustTurnus: z.string().optional().or(z.literal('')),
  ustFinanzamtStatus: z.string().optional().or(z.literal('')),
  lohnDurchUns: z.enum(['Ja', 'Nein']),
  lohnsteuerTurnus: z.string().optional().or(z.literal('')),
  lohnFinanzamtStatus: z.string().optional().or(z.literal('')),

  notizen: z.string().optional().or(z.literal('')),
  datenschutzBestaetigt: z.literal(true)
}).superRefine((data, ctx) => {
  if (data.rechtsform === 'Sonstige' && !data.rechtsformSonstige.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['rechtsformSonstige'], message: 'Bitte Rechtsform angeben.' });
  }

  if (['Einzelunternehmen', 'Freiberufler'].includes(data.rechtsform) && !data.inhaber1.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['inhaber1'], message: 'Bitte Inhaber angeben.' });
  }

  if (['GbR', 'OHG', 'KG', 'GmbH', 'UG (haftungsbeschränkt)', 'AG', 'Sonstige'].includes(data.rechtsform) && !data.gesellschafter1.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['gesellschafter1'], message: 'Bitte Gesellschafter angeben.' });
  }

  if (['GmbH', 'UG (haftungsbeschränkt)', 'AG', 'Sonstige'].includes(data.rechtsform) && !data.geschaeftsfuehrer1.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['geschaeftsfuehrer1'], message: 'Bitte Geschäftsführer angeben.' });
  }

  if (data.handelsregisterVorhanden === 'Ja' && !data.handelsregisternummer.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['handelsregisternummer'], message: 'Bitte Handelsregisternummer angeben.' });
  }

  if (data.fibuGewuenscht === 'Ja' && !data.fibuAb.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['fibuAb'], message: 'Bitte Startdatum für Finanzbuchhaltung angeben.' });
  }

  if (data.lohnGewuenscht === 'Ja' && !data.lohnAb.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['lohnAb'], message: 'Bitte Startdatum für Lohn angeben.' });
  }

  if (data.sonstigeBeratungGewuenscht === 'Ja' && !data.sonstigeBeratungText.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['sonstigeBeratungText'], message: 'Bitte Beratungswunsch beschreiben.' });
  }

  if (data.ustPflichtig === 'Ja' && !data.ustTurnus.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['ustTurnus'], message: 'Bitte USt-Turnus angeben.' });
  }

  if (data.lohnDurchUns === 'Ja' && !data.lohnsteuerTurnus.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['lohnsteuerTurnus'], message: 'Bitte Lohnsteuer-Turnus angeben.' });
  }
});

export const newEmployeeSchema = z.object({
  firma: z.string().min(2, 'Arbeitgeber / Unternehmen ist erforderlich'),
  einstellungsart: z.string().min(2, 'Einstellungsart ist erforderlich'),

  vorname: z.string().min(2, 'Vorname ist erforderlich'),
  nachname: z.string().min(2, 'Nachname ist erforderlich'),
  strasse: z.string().min(2, 'Straße / Hausnummer ist erforderlich'),
  plz: z.string().min(4, 'PLZ ist erforderlich'),
  ort: z.string().min(2, 'Ort ist erforderlich'),
  geburtsdatum: z.string().min(4, 'Geburtsdatum ist erforderlich'),
  staatsangehoerigkeit: z.string().min(2, 'Staatsangehörigkeit ist erforderlich'),

  email: z.string().email().optional().or(z.literal('')),
  telefon: z.string().optional().or(z.literal('')),

  steuerId: z.string().optional().or(z.literal('')),
  steuerklasse: z.string().optional().or(z.literal('')),
  konfession: z.string().optional().or(z.literal('')),
  svNummer: z.string().optional().or(z.literal('')),

  geburtsname: z.string().min(2, 'Geburtsname ist erforderlich'),
  geburtsort: z.string().min(2, 'Geburtsort ist erforderlich'),
  geburtsland: z.string().min(2, 'Geburtsland ist erforderlich'),
  krankenkasse: z.string().optional().or(z.literal('')),
  versicherungsart: z.string().optional().or(z.literal('')),

  eintrittsdatum: z.string().min(4, 'Eintrittsdatum ist erforderlich'),
  taetigkeitsbereich: z.string().min(2, 'Tätigkeitsbereich ist erforderlich'),
  arbeitsort: z.string().optional().or(z.literal('')),
  verguetungsart: z.string().min(2, 'Vergütungsart ist erforderlich'),
  stundensatz: z.string().optional().or(z.literal('')),
  gehaltsbetrag: z.string().optional().or(z.literal('')),
  gehaltExtras: z.string().optional().or(z.literal('')),

  wochenstunden: z.string().optional().or(z.literal('')),
  arbeitstage: z.array(z.string()).optional(),
  urlaubsanspruch: z.string().optional().or(z.literal('')),

  minijobVerdienst: z.string().optional().or(z.literal('')),
  weitereMinijobs: z.string().optional().or(z.literal('')),
  weitererMinijobArbeitgeber: z.string().optional().or(z.literal('')),
  weitererMinijobVerdienst: z.string().optional().or(z.literal('')),
  weitererMinijobBeginn: z.string().optional().or(z.literal('')),
  rvBefreiung: z.string().optional().or(z.literal('')),

  midijobMonatsverdienst: z.string().optional().or(z.literal('')),

  immatrikulationVorhanden: z.string().optional().or(z.literal('')),

  ausbildungsberuf: z.string().optional().or(z.literal('')),
  ausbildungsbeginn: z.string().optional().or(z.literal('')),

  beteiligungProzent: z.string().optional().or(z.literal('')),
  sperrminoritaet: z.string().optional().or(z.literal('')),

  rentenart: z.string().optional().or(z.literal('')),
  rentenbeginn: z.string().optional().or(z.literal('')),

  mycenterHinweisAkzeptiert: z.boolean().optional(),
  arbeitsvertragGewuenscht: z.string().optional().or(z.literal('')),
  vertragsart: z.string().optional().or(z.literal('')),
  probezeit: z.string().optional().or(z.literal('')),
  kuendigungsfrist: z.string().optional().or(z.literal('')),
  zusatzvereinbarungen: z.string().optional().or(z.literal('')),
  notizen: z.string().optional().or(z.literal('')),
  warnungen: z.array(z.string()).optional() });

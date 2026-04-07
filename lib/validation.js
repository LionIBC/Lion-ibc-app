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
  firma: z.string().min(2),
  vorname: z.string().min(2),
  nachname: z.string().min(2),
  geburtsdatum: z.string().min(4),
  email: z.string().email().optional().or(z.literal('')),
  telefon: z.string().optional(),
  strasse: z.string().min(2),
  plz: z.string().min(4),
  ort: z.string().min(2),
  staatsangehoerigkeit: z.string().optional(),
  familienstand: z.string().optional(),
  steuerId: z.string().optional(),
  svNummer: z.string().optional(),
  krankenkasse: z.string().optional(),
  eintrittsdatum: z.string().min(4),
  beschaeftigungsart: z.string().min(2),
  wochenstunden: z.string().optional(),
  gehalt: z.string().optional(),
  iban: z.string().optional(),
  notizen: z.string().optional()
});

/** Optional street-mesh choices for existing named speakers.
 * The title of a mesh is an art-source label, never a replacement game identity.
 * Each choice was checked against the cast's gender and general demeanor.
 */
export const STREET_TEMPLATE_GENDER = Object.freeze({
  kehrwoche: 'female', ordnungsamt: 'male', pfand: 'female',
  wanderer: 'male', garten: 'female', pendler: 'male',
  radweg: 'ambiguous', warteschlange: 'female'
});

export const STREET_PERSONA_MAP = Object.freeze({
  'stadt-klaus-dieter-klein': {templateId: 'pendler', fit: 'Practical, ordinary passerby'},
  'stadt-brigitte-mueller': {templateId: 'warteschlange', fit: 'Patient, procedural citizen'},
  'stadt-wolfgang-schulz': {templateId: 'pendler', fit: 'Routine appointment citizen'},
  'stadt-ursula-neumann': {templateId: 'warteschlange', fit: 'Citizen protesting an obstruction'},
  'stadt-manfred-din': {templateId: 'ordnungsamt', fit: 'Clipboard and rule-minded pedantry'},
  'stadt-irmgard-aktenstapel': {templateId: 'garten', fit: 'Older, weary citizen with forms'},
  'stadt-guenther-tuev': {templateId: 'ordnungsamt', fit: 'Strict public-order enforcer'},
  'stadt-hannelore-sparkasse': {templateId: 'warteschlange', fit: 'Dry concern with orderly passage'},
  'stadt-karl-heinz-post': {templateId: 'pendler', fit: 'Detached, office-going worker'},
  'stadt-herbert-rasenaufsicht': {templateId: 'ordnungsamt', fit: 'Forceful guardian of public-space rules'},
  'stadt-waltraud-ordnung': {templateId: 'kehrwoche', fit: 'Firm, easily provoked order keeper'},
  'stadt-erwin-archiv': {templateId: 'pendler', fit: 'World-weary paperwork commuter'},
  'stadt-renate-termin': {templateId: 'kehrwoche', fit: 'Impatient appointment enforcer'},
  'stadt-heinz-mietnachweis': {templateId: 'pendler', fit: 'Tired, low-energy citizen'},
  'stadt-monika-zebra': {templateId: 'warteschlange', fit: 'Unhurried believer in ordinary order'},
  'stadt-joachim-fundsache': {templateId: 'pendler', fit: 'Detached administrative worker'},
  'stadt-ute-ruhe': {templateId: 'garten', fit: 'Quietly irritable older citizen'},
  'stadt-norbert-faxrolle': {templateId: 'pendler', fit: 'Defeated by old procedures'},
  'stadt-edeltraud-trennung': {templateId: 'warteschlange', fit: 'Blunt procedural citizen'},
  'crowd-baerbel-brezel': {templateId: 'pfand', fit: 'Everyday sidewalk passerby'},
  'crowd-brigitte-bueroklammer': {templateId: 'garten', fit: 'Low-key, territorial passerby'},
  'crowd-dietmar-din-norm': {templateId: 'pendler', fit: 'Low-energy procedural passerby'},
  'crowd-elfriede-eingabe': {templateId: 'warteschlange', fit: 'Procedural queue-minded passerby'},
  'crowd-guenther-gartenzaun': {templateId: 'ordnungsamt', fit: 'Forceful territorial rule keeper'},
  'crowd-hildegard-brotzeit': {templateId: 'pfand', fit: 'Everyday sidewalk passerby'},
  'crowd-horst-hausordnung': {templateId: 'ordnungsamt', fit: 'High-energy house-order enforcer'},
  'crowd-irmgard-aktenordner': {templateId: 'warteschlange', fit: 'Procedure-minded passerby'},
  'crowd-klaus-dieter-knoedel': {templateId: 'ordnungsamt', fit: 'High-energy sidewalk rule keeper'},
  'crowd-manfred-mittagsruhe': {templateId: 'pendler', fit: 'Low-energy passerby guarding quiet'},
  'crowd-ruediger-rasenkante': {templateId: 'ordnungsamt', fit: 'High-energy lawn-rule enforcer'},
  'crowd-waltraud-wartemarke': {templateId: 'kehrwoche', fit: 'High-energy queue-order enforcer'}
});

# Quiz character dictionary

[`QUIZ-CHARACTER-DICTIONARY.js`](./QUIZ-CHARACTER-DICTIONARY.js) is the runtime and durable authority for the fictional people who open roaming quiz cards. It binds each identity to one portrait, dossier copy, and eligible question categories. Do not randomize a personal name independently from its portrait.

## Runtime cast

| Character | Fictional role | Eligible categories |
| --- | --- | --- |
| Gisela Becker | Besorgte Bürgerin | civic, B1 grammar |
| Rüdiger Schmidt | Grammatikpolizei | B1, B2, C1 grammar |
| Sabine Krüger | Selbsternannte Sprachlehrerin | B1, B2 grammar |
| Uwe Möller | Vertreter der Bürgerempörung | civic, fictional traffic |
| Brigitte Neumann | Sprecherin der Stadtbildwacht | civic, fictional traffic |
| Klaus-Dieter Wagner | Freiwilliges Ordnungsamt | civic, fictional traffic |
| Heike Hoffmann | Nachbarschaftliche Hinweisperson | civic, fictional traffic |
| Dr. Dietmar Schulz | Inoffizieller Zertifikatsprüfer | B1, B2, C1 grammar |
| Hartmut Keller | Para-polizeilicher Nachbar | civic, fictional traffic |

Every organization, office, title, authority claim, and portrait is fictional. The joke targets self-appointed procedural authority, not a real person, agency, nationality, age, gender, or profession.

## Vocabulary and names

The JavaScript authority includes a broad `archetypeLexicon` for affectionate Gutbürger variants and a `nameBank` for future authored identities. These are writing resources, not permission to detach a name from an existing portrait. Prefer alleged jurisdiction, laminated evidence, and procedural certainty over direct insults.

## Question categories

- `civic`: lightly adapted BAMF catalog tasks. Keep the official task number and source date visible.
- `traffic`: original fictional driving-school jokes. Always label them `FIKTIVE SPIELFRAGE`.
- `grammar-b1`, `grammar-b2`, `grammar-c1`: original certificate-style drills, not copied exam items. Always label them `ZERTIFIKATSNAHE SPIELÜBUNG · KEIN ECHTER PRÜFUNGSSATZ`.

The card’s factual context must remain concise and current: § 10(4) StAG generally names B1 for naturalization; B2 requirements depend on the specific course, training provider, or employer; university admission depends on the accepted certificate and program, with TestDaF TDN 4 in every section generally establishing unrestricted admission; the CEFR has A1, A2, B1, B2, C1, and C2, not B3. Keep the general game disclaimer that this is satire, not legal, immigration, education, or admissions advice.

## Visual contract

The nine 512 × 512 WebP dossier portraits live under `assets/quiz-characters/` and are shared by desktop and mobile. They use one raw psychological-expressionist RPG language: broken oil-and-gouache planes, mature asymmetrical faces, restrained eyes, straighter noses, and emotionally contained bureaucratic expressions. Each character sits against the same quiet gray-beige dossier field with no scenery, and every portrait retains a wide top margin that keeps the complete head and hairstyle inside the frame. Desktop keeps the portrait/dossier column on the left of the question sheet. Mobile stacks the compact dossier above the choices so the modal remains usable. A missing image falls back to the visible § placeholder without blocking the quiz.

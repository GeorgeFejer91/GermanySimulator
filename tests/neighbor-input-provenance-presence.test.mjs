import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';

// Finite regression identities for the qualified Heiko variants. This does not
// admit media or require unpublished candidates to appear in an older checkout.
// Both public surfaces are checked independently so deleting a whole optional
// block from manifest and generated metadata cannot silently restore "legacy".
const literalReference={
  "policy": "literal-reference-pcm-excerpt-v1",
  "profileId": "fec92a799b3a48879cc2d90ce2ae2e10",
  "profileReferenceSha256": "1ccb91c8cc1fd03ee28fd46b0d727e7f69717ed70e15210c538a1283dca26c06",
  "sourceStartSample": 0,
  "sourceEndSampleExclusive": 97920,
  "sourceSampleRateHz": 24000,
  "sourceChannels": 1,
  "sourceBitsPerSample": 16,
  "referenceSha256": "012b9c85f149767274b44fc9a977c7bf8e6d69d69cfaaa9fc5d1e7aa8aac975f",
  "referencePcmSha256": "55accb637a508f3161f03889d4c2a4bc4d2e81ef5acd81a8662eb42e5976945a",
  "referenceText": "Hello everybody, my name is Heiko Schmidt.",
  "referenceTextSha256": "c918935c45756afc17c6b8a252f30d9862ec81da105cdfbb0ff5873b504ed6e9",
  "inputProofSha256": "b501efa381506adec6b0992cedbf0c3f33f63ca28758babdfdb5e9e6868b5465",
  "boundaryEvidenceSha256": "8351bc24487fcbb95d0560694dcd4775521c7fd1bba92ff7b8bc30c6e6498845"
};
const expectedVariants=[
 {"clipId":"heiko-polish-01","sha256":"5ecb7f54d560e67cb227ed8d3c4eaa1c2f9a8e1e29cf861f25565d9b007e5650","whole":{},"parts":[]},
 {"clipId":"heiko-parking-01","sha256":"e17e948332ca9fc3e898e1ce80ef486316fb78667332697438ec9a7dac8a85bf","whole":{},"parts":[]},
 {"clipId":"heiko-latin-01","sha256":"63062f2eacb7cd46bb516c5c07d0a3f81f84998303a6fb4881dac88a4f538dc5","whole":{},"parts":[]},
 {"clipId":"heiko-smalltalk-01","sha256":"f78ab322973ba820e08602aa3cd1e59c68724359b15ee639a7454cbd307e0852","whole":{},"parts":[]},
 {"clipId":"heiko-parent-01","sha256":"332932aa20f11489d8059e06a39bf06a52a4f4eddb38c396c4177f955600e7f1","whole":{},"parts":[]},
 {"clipId":"heiko-paint-01","sha256":"caf110a7bceffbf83727b5bbdb269991e5cf17a4be7414f164fc007fb4a40b50","whole":{"referenceConditioning":literalReference},"parts":[]},
 {"clipId":"heiko-concern-01","sha256":"06316635bd6918737266b12062d2ab5901ca4ec508376ae5e66ea12727a5655d","whole":{},"parts":[{"index":0,"sourceStart":0,"sourceEnd":74,"text":"Ich war vorhin kurz an Ihrem Garten, nur um Ihnen … Sie waren ja nicht da.","sourceSha256":"3abb241a624d3d398b25a12997063e99d9efe6ce3383c178e80542ba6d6d2937","encodedSha256":"43aecab5a2f1fdc4b73eefa4a73d532cb27e49f18314f28b1904ff68a497662c","fields":{}},{"index":1,"sourceStart":75,"sourceEnd":122,"text":"Die Pflanzen hier, die machen wir dann weg, ja?","sourceSha256":"e19b4212eeaaebfabc7646412f65293c05de0599dd99bcc148af9007961c324b","encodedSha256":"5ef71e2c4244655794042ec846c00e4b21aeb4acac3434099ae6505c714dc3cc","fields":{"referenceConditioning":literalReference,"actualInferenceText":"Die Pflanzen hier, die machen wir dann weg. Ja?","actualInferenceSha256":"dd967323292efe1d99912a65cfc8fbf3514a5c2c496912117ba1ec87cfa50484","canonicalSourceSha256":"e19b4212eeaaebfabc7646412f65293c05de0599dd99bcc148af9007961c324b","renderNormalizationPolicy":"finite-spoken-tag-and-elision-punctuation-v1"}},{"index":2,"sourceStart":123,"sourceEnd":175,"text":"Ich wollte Ihnen nur zeigen, wo Sie anfangen können.","sourceSha256":"51903b20a1c2d0f5f07a2ff1c9b23af95fb98a492ac681b1db8c1fd1366f2454","encodedSha256":"373ac80e85420fa25602bfefaf0db116a535cb506510d15cf6371dd12fa18f33","fields":{}},{"index":3,"sourceStart":176,"sourceEnd":234,"text":"Dann stehen Sie nachher nicht davor und wissen nicht, wie.","sourceSha256":"14b97ed18eccdcadd8da1384d408be8e9aca92f358b5ba779ce853fdcaf40877","encodedSha256":"3d7f4193cbd3e3363085694dbac98868eb14c04f29c257546e833d770a1e1772","fields":{"referenceConditioning":literalReference}}]},
 {"clipId":"heiko-parent-02","sha256":"bea18c633649cfdad904cf096888fec3be2d3c17937fed5f39af971b0d12c99a","whole":{},"parts":[]},
 {"clipId":"heiko-paint-02","sha256":"b5fac9ead3def23b06aa06b35197b642ceb49efad323505ba15818a700bdc2f1","whole":{},"parts":[]},
 {"clipId":"heiko-concern-02","sha256":"de5fbb862dacc16f33b4301734b836e3d7503211e9f7e24e90526aecde06a805","whole":{},"parts":[]},
 {"clipId":"heiko-polish-02","sha256":"127b404b39de6d0f765093c12210756fe791376b8903eb667995f9f19f30605b","whole":{},"parts":[]},
 {"clipId":"heiko-parking-02","sha256":"a2586b845229b715bc334c59157dd5d28be5eae36c83e70aa8285f809582b79b","whole":{},"parts":[]},
 {"clipId":"heiko-latin-02","sha256":"994c0a1bb78faa1775f967523a9dc42ac76fac84d78c3676ea4cc62fd295c8cf","whole":{},"parts":[]},
 {"clipId":"heiko-smalltalk-02","sha256":"3cb667172179ad09f36f019ba63451ff38abb03da2c72785a20b3035da0e121d","whole":{},"parts":[]},
 {"clipId":"heiko-parent-03","sha256":"f82bfedd0d5611585a3accdc85d037d182876d0963f845e0f6c48ee3d9a12ce5","whole":{},"parts":[]},
 {"clipId":"heiko-story-16","sha256":"c28f96f694ca2b7e5cf46bd3ef50b0eeb12d69b65932ffe7f52a935b37b0e608","whole":{"referenceConditioning":literalReference},"parts":[]},
 {"clipId":"heiko-story-17","sha256":"fe069f7d61d6442685253fda5dd74300303917dc08617038e4ed5b42490b3a4f","whole":{"referenceConditioning":literalReference},"parts":[]},
 {"clipId":"heiko-story-18","sha256":"f885e77a45d5a1c5779c7d1a234de5136f0f967a9de924b961ef9577fb021d41","whole":{},"parts":[{"index":0,"sourceStart":0,"sourceEnd":72,"text":"Wenn es hier glatt wird, machen Sie Ihren Abschnitt dann gleich mit, ja?","sourceSha256":"b34a17659299e96c76736b5c0251773eb6dd2778a64d203eab436f4ab10e7eb2","encodedSha256":"db681ba548935f6dee97307a2893447153d27403632e5d6cb6ac7ee1bcb471fa","fields":{"referenceConditioning":literalReference,"actualInferenceText":"Wenn es hier glatt wird, machen Sie Ihren Abschnitt dann gleich mit. Ja?","actualInferenceSha256":"d8fe366567b442af219cc76f4823d5979593d4582c37fac6daa4c3aef8572b3f","canonicalSourceSha256":"b34a17659299e96c76736b5c0251773eb6dd2778a64d203eab436f4ab10e7eb2","renderNormalizationPolicy":"finite-spoken-tag-and-elision-punctuation-v1"}},{"index":1,"sourceStart":73,"sourceEnd":197,"text":"Also, dass man morgens durchkommt. Ich sage es Ihnen jetzt schon, damit Sie später nicht extra … Sie wissen ja, wie das ist.","sourceSha256":"c5412b44923cdee2f106b80194b9f012f4b7aae118c3caf1695e9a4450907878","encodedSha256":"65367a27e54ace89b6145dafdacbcf86529114b4a5cd27db222008cda7ed101c","fields":{"referenceConditioning":literalReference}},{"index":2,"sourceStart":198,"sourceEnd":255,"text":"Wir achten bei uns auch drauf. Ist ja selbstverständlich.","sourceSha256":"f63cbd6435a1b219a5959bf48f73ce4ea1365509e84a74465617b2aef7da57ee","encodedSha256":"5f5f6be30350b8b70e98bc1eeb17ec528aa45902611a0aefa56c6653bd47cd7b","fields":{}}]},
 {"clipId":"heiko-story-19","sha256":"3a8a65a1a0ead46007b64c6d81426cf23d55d7cc76f60eb68f34b04fd55d157b","whole":{},"parts":[]},
 {"clipId":"heiko-story-20","sha256":"657e2a7d00902395e718da842b6809879bd42e46d0a760b45f3f57bb360fbcdb","whole":{},"parts":[]},
 {"clipId":"heiko-story-21","sha256":"1edb24c2e6f6c970a089075cc3985ec2b0e7210352935b3666084d3ab06f8e39","whole":{},"parts":[]},
 {"clipId":"heiko-story-22","sha256":"46ef978c66ccbcce341cd5996e0b3a868d529a3342094d05edf44871bf5e3468","whole":{},"parts":[{"index":0,"sourceStart":0,"sourceEnd":65,"text":"Ich hätte Ihnen auch einen Zettel … aber das braucht es ja nicht.","sourceSha256":"28b3b8edaca24bb61057d0d9c26a107e7bede14a33f68feb9738399157574d0a","encodedSha256":"e24977ebed4dd89dd9663e5071a9e4013ed12881e8e6f7bbe3a1604343f9ea3b","fields":{}},{"index":1,"sourceStart":66,"sourceEnd":222,"text":"Sie haben’s jetzt gesehen. Sagen Sie mir einfach kurz, wann Sie danach schauen, dann muss ich Sie nicht noch einmal damit … Kommen Sie, Hartmut ist am Haus.","sourceSha256":"faa8b3dd81736319694cad7acf1b63981b0b93a7cd891efb3bf1465d5a322f1b","encodedSha256":"030806b646e7b9990b61270e0c5121a7a5b1803ee357d0951a957f5db91cc247","fields":{"actualInferenceText":"Sie haben es jetzt gesehen. Sagen Sie mir einfach kurz, wann Sie danach schauen, dann muss ich Sie nicht noch einmal damit … Kommen Sie, Hartmut ist am Haus.","actualInferenceSha256":"5208291eb7ef218e5e3a2c21e26f4713710562359e008181cc1bf7c741258d7f","canonicalSourceSha256":"faa8b3dd81736319694cad7acf1b63981b0b93a7cd891efb3bf1465d5a322f1b","renderNormalizationPolicy":"finite-authored-apostrophe-contractions-v1"}}]},
 {"clipId":"heiko-story-23","sha256":"097e80d0195ac69fbb425eac5c1f80365250442101c9adb6fb4be45ed87466bc","whole":{},"parts":[]},
 {"clipId":"heiko-story-24","sha256":"cf9d612014ff425760dfbc81bb57c5232af45aa5fe0c2d95a945ec14822c481f","whole":{},"parts":[{"index":0,"sourceStart":0,"sourceEnd":48,"text":"Hartmut! Komm mal kurz, der neue Nachbar ist da.","sourceSha256":"3e6af010b696f09b3149c48ce6aa8205d8aaa8852a73ecc455288f901bd108a3","encodedSha256":"f65b01aa1a63866a209e226488c13f6a2ac7fad8d17b4a12749114ef6c5ae2d2","fields":{}},{"index":1,"sourceStart":49,"sourceEnd":83,"text":"Acht ist er, sechs Sprachen schon.","sourceSha256":"b2c89984569ef35e938c3f2b53b16d08e2f94f65ddeeac389482085f35bbe319","encodedSha256":"0d395354b01493cd1f5a0083f2a356aff58c348e7fdc3455ec1fbc7ff1c23012","fields":{}},{"index":2,"sourceStart":84,"sourceEnd":171,"text":"Nur Latein, da müssen wir noch ein bisschen … also, wir helfen ihm, dass er dranbleibt.","sourceSha256":"7adb36da8a484dc6aa19ffb8285e77602cf4355805c03cb1587255e8891d8ed1","encodedSha256":"3c82768c01dfe6562d4d3ee6b524b6347249753672c9dee5fe7b4f29935a20b7","fields":{}},{"index":3,"sourceStart":172,"sourceEnd":202,"text":"Dann hat er’s später leichter.","sourceSha256":"df4cab1453714eca86951533f2059b3f5a0db9a9a8f597a6ec78a7307d3a9a5d","encodedSha256":"3c98aed3623bd47abf2b3a273b181876147a628900e7773476bddb5005ddda2a","fields":{"referenceConditioning":literalReference,"actualInferenceText":"Dann hat er es später leichter.","actualInferenceSha256":"8563e3cf609be45799a4753ff34006515fe1c6e5efd68bd696c4f8f9d3625ccf","canonicalSourceSha256":"df4cab1453714eca86951533f2059b3f5a0db9a9a8f597a6ec78a7307d3a9a5d","renderNormalizationPolicy":"finite-authored-apostrophe-contractions-v1"}},{"index":4,"sourceStart":203,"sourceEnd":261,"text":"Hartmut, die Pause kannst du doch auch gleich hier machen.","sourceSha256":"58cf05d0002a7cfe79804ebca4fe803a6754887dcbe4764d1788e9ad91e6592a","encodedSha256":"b7bc7784a73259c3ce9b6d9aff01bd63bbe8939ceba05134ca75f589d6774190","fields":{}}]},
 {"clipId":"heiko-story-25","sha256":"74094a1f11695a78a1737aab399b9d3333e99b61cad65c56c4577be73a519c5e","whole":{},"parts":[]},
 {"clipId":"heiko-story-26","sha256":"4f3bbdf4d34fae7bb7218a4646ecdf95462a7fc5b5dbfc2a7cd44172433eef79","whole":{},"parts":[{"index":0,"sourceStart":0,"sourceEnd":87,"text":"Ach, hier also. Ja, ich habe ihm gesagt, er soll ruhig mal selber … Das tut ihm ja gut.","sourceSha256":"e8d9da08c9093e7651fb49cef215a4c4877a52d6bc8302328c1a2acc3c9536f5","encodedSha256":"9702554645eb35953bc440b6460f58a5b483d50e95fa140203c9faba38674717","fields":{"referenceConditioning":literalReference}},{"index":1,"sourceStart":88,"sourceEnd":162,"text":"Hartmut, nur nicht so laut, dann haben die anderen auch was von der Pause.","sourceSha256":"83bd8cec91ee1a599c7ea02adff89872b44d871274e1f4c1b3ce88f3b51069e8","encodedSha256":"ceccd3efe60bd7b418220f658394454e0f888b5dc3e8ec43863685bb0542307a","fields":{}},{"index":2,"sourceStart":163,"sourceEnd":220,"text":"Sie können Inga nachher sagen, dass er schön draußen war.","sourceSha256":"9c4687011885c8a247ff9cd74db3b06b692cda63fbca71f2f6235825458c2caa","encodedSha256":"c54884f36ca0502de3ac79f62508a0f229122be24811722d50c515a1327b731b","fields":{}}]},
 {"clipId":"heiko-story-27","sha256":"e5249c6bf73e81e88a2ed92cfd895285027bc8179bf6862710df2f0f1cb9c0c8","whole":{},"parts":[{"index":0,"sourceStart":0,"sourceEnd":136,"text":"Heute ist ja alles trocken. Da können Sie sich das in Ruhe anschauen, bevor dann im Winter … Ich wollte Ihnen nur die Rennerei ersparen.","sourceSha256":"860a5d4133781f13ae4ddcd5ef4a8813d6ed75a04a461e997ee2ee3b51d3b2bc","encodedSha256":"52c60765b131eeb93f77dffcf049455936cff76a6d569cd5db7b8462d64538db","fields":{}},{"index":1,"sourceStart":137,"sourceEnd":174,"text":"Wenn Sie jemanden dafür haben, schön.","sourceSha256":"2e6ecc5c2e1eedafca06dcfea45df32bcb72899943a15c39983588318971610e","encodedSha256":"5c37010ea3a3c4c096e9cdb1e5ac36c08844b9a95f20c6b15786cfb06ca86a4a","fields":{}},{"index":2,"sourceStart":175,"sourceEnd":225,"text":"Sie schauen dann trotzdem kurz, ob es gemacht ist,","sourceSha256":"c05893a9a311ce35cf7eed967cf2245336523cb0d5ad110e78b990a7a4083af5","encodedSha256":"fec8f3e9d7186a7434132a4551319c8a8bf6bd38ea29c58b51b856d671b84905","fields":{"referenceConditioning":literalReference}},{"index":3,"sourceStart":226,"sourceEnd":229,"text":"ja?","sourceSha256":"b2179ce3cce612ed89d976256f2cc6700518cd0c478976ed849021e25d2dca25","encodedSha256":"859d8eeab0fd0cdb9b9914661148e14312e2424dcd0bdbf1e4f6a834953708bb","fields":{"referenceConditioning":literalReference}}]},
 {"clipId":"heiko-story-28","sha256":"538d9def51864971beea9a50090da59800077c250ef8604abd2709725d9c9138","whole":{},"parts":[]},
 {"clipId":"heiko-story-29","sha256":"d3869a192f96e984ddb40797cf6e131f47462e1a100937e1a97d02b6b40ef5dc","whole":{},"parts":[]},
 {"clipId":"heiko-story-30","sha256":"f6bc9768ffd33e556369df40eb850d6744d6173d03b9d7678b917ef298d12a9e","whole":{},"parts":[]},
 {"clipId":"heiko-story-31","sha256":"752365a6a7be93d7ea8fc490c58831fe137bb2c333f48b48abe987d8164de86f","whole":{},"parts":[{"index":0,"sourceStart":0,"sourceEnd":103,"text":"Ich wollte Ihnen eigentlich nur einen Zettel hinlegen, damit Sie nicht … Aber persönlich ist ja netter.","sourceSha256":"a83db8be3c835e1319df2e5b33a4cd79b8e5e234be31ef7fdd654a07dc848422","encodedSha256":"09508d7cc41ed053fcf7858093d541080cd0fdc9153c41d4602c99027888619a","fields":{}},{"index":1,"sourceStart":104,"sourceEnd":190,"text":"Das machen Sie dann, ja? Mir wäre es auch unangenehm, wenn ich noch mal fragen müsste.","sourceSha256":"27de238aa7fe3d233c10232e3270c5c6b5dabf9ea8972e8148462b5f515f48dc","encodedSha256":"6c7d1fbab6d393a577fc8cd983ead1d27265197417d92bbcb790e8f3a5963151","fields":{}},{"index":2,"sourceStart":191,"sourceEnd":226,"text":"Aber so weit sind wir ja gar nicht.","sourceSha256":"cc9978caa942c9d3a2593d8502d302746175b6d9e5f1408abed114cee4a11218","encodedSha256":"d19888a07a5d62f1a1a61233281fa34427570aa827b55a80590e7205e93eedd1","fields":{}}]},
 {"clipId":"heiko-story-32","sha256":"fc017cb88abdd8e0cfc566574b68363ec2920d1dbb61c525a417869703ff166c","whole":{},"parts":[]},
 {"clipId":"heiko-story-33","sha256":"102477df14ec8ecc6ee25c4304c3d895827436a85ee923d4108fd3397882f8c7","whole":{},"parts":[{"index":0,"sourceStart":0,"sourceEnd":35,"text":"Hartmut, der Nachbar ist wieder da.","sourceSha256":"71fb52b5a5a3334c8cb77e227e342ba34b063b00f98fe49a00bd68d770b3e24b","encodedSha256":"9aa4db3db91eb59fb794d70c5239fc6f6cf067272a7b80d641c81984d12311ba","fields":{}},{"index":1,"sourceStart":36,"sourceEnd":80,"text":"Zeig ihm doch noch einmal … also dein Spiel.","sourceSha256":"93afaa2c377ec5437bab18f83941324b1b3b982975a5abed3ded0a8fab96b471","encodedSha256":"e385bd2f0af658370ca54fc2099e1a5dae8d8c4c307fc5fbcc1b19bff4eec440","fields":{}},{"index":2,"sourceStart":81,"sourceEnd":131,"text":"Dann brauchst du’s später nicht noch mal erklären.","sourceSha256":"dffb511ea51f40f44fbf94a0065d42a2bf8d273a3b826fb57ab1a8ffb554b473","encodedSha256":"163418dfc14c1db651ec23795cb82513dcd8f192b857859004b0d8e3d8e7e95d","fields":{"referenceConditioning":literalReference}},{"index":3,"sourceStart":132,"sourceEnd":163,"text":"Aber danach kommst du rein, ja?","sourceSha256":"b30f67fb8da5df484d50bc84ab6bba52b4797c93d135746e09a30670129b01d6","encodedSha256":"b755154279a4f6695067efe4314abb25ee46c482cbce61dcad51370d02917c2c","fields":{}},{"index":4,"sourceStart":164,"sourceEnd":215,"text":"Sonst wird dir die Zeit mit Latein wieder so knapp.","sourceSha256":"8844776d20ab88c825c03fb535fe857eec946092ce30766099b42d0f0f02af9f","encodedSha256":"1ab57c790addc76adbdfe39db57ee99d2b32b823efbf50abe64b43afea71f7de","fields":{}}]},
 {"clipId":"heiko-story-34","sha256":"4564629957206653fe605dd41d40413fff2c29b59852261600d5838c4a95f782","whole":{},"parts":[]},
 {"clipId":"heiko-story-35","sha256":"d5be16864a76cdd89aec680b0b9c04222875013a72fdf50d5ba454507c8e3fe7","whole":{},"parts":[]},
 {"clipId":"heiko-story-36","sha256":"6793a4e0724db90702497c5da9412104292632ec8876045cb934e28000694455","whole":{},"parts":[{"index":0,"sourceStart":0,"sourceEnd":77,"text":"Ach, Sie möchten schon … die Sache mit Ihrem Einzug klären Sie dann erst, ja?","sourceSha256":"a077c79a501ef255a5e0430e137d81987ffeacc48ed9d3b3f24e412e4c6997cc","encodedSha256":"8b760e71704650e8097283d2ec7e600851d6603955bfb38aea5d5cf2a1a3f2ca","fields":{}},{"index":1,"sourceStart":78,"sourceEnd":185,"text":"Ich sage Ihnen das nur, damit wir nachher nicht alles zweimal … Wir haben ja noch Zeit, uns kennenzulernen.","sourceSha256":"c3cad61a2ebc6f08763f2488a3addb571baa79fa3351d56460c685c12359bcb5","encodedSha256":"ce8c833fe906633243027c4886e4dd2e89e776c34e23f711aa10ebce30061078","fields":{"referenceConditioning":literalReference}},{"index":2,"sourceStart":186,"sourceEnd":213,"text":"Sie wissen ja, wie das ist.","sourceSha256":"efd7d0b9ec7063266387a2ebd57b856566b88f28f66f6585050d8ef9c5dc4238","encodedSha256":"c3bdc1e492a6278a9b5bc2ab6d67dab690cc50c85b06036d3713b25d378462b8","fields":{}}]}
];

const provenanceFields=['referenceConditioning','actualInferenceText','actualInferenceSha256','canonicalSourceSha256','renderNormalizationPolicy'];
const inferenceFields=provenanceFields.slice(1);
const sha=text=>createHash('sha256').update(text).digest('hex');
const pick=(value,fields=provenanceFields)=>Object.fromEntries(fields.filter(key=>Object.hasOwn(value,key)).map(key=>[key,value[key]]));
const clone=value=>structuredClone(value);
function checkManifest(clip,expected){
 assert.equal(clip.clipId,expected.clipId,'encoded variant clip identity');
 assert.equal(clip.sha256,expected.sha256,'encoded variant hash');
 assert.deepEqual(pick(clip),expected.whole,'whole inference/reference provenance');
 const parts=clip.nativeParts||[];
 assert.equal(parts.length,expected.parts.length,'complete indexed native parts retained');
 for(const part of expected.parts){
  const actual=parts[part.index];
  assert.equal(actual.index,part.index,'native part index');
  assert.equal(actual.sourceStart,part.sourceStart,'native part source start');
  assert.equal(actual.sourceEnd,part.sourceEnd,'native part source end');
  assert.equal(sha(actual.text),part.sourceSha256,'native part canonical source');
  assert.equal(actual.encodedSha256,part.encodedSha256,'native part encoded identity');
  assert.deepEqual(pick(actual),part.fields,'indexed native inference/reference provenance');
 }
}
function expectedMetadata(expected){
 const references=expected.parts.filter(p=>p.fields.referenceConditioning).map(p=>({index:p.index,referenceConditioning:p.fields.referenceConditioning}));
 const inputs=expected.parts.filter(p=>inferenceFields.some(k=>Object.hasOwn(p.fields,k))).map(p=>({index:p.index,...pick(p.fields,inferenceFields)}));
 return{...expected.whole,...(references.length?{nativePartReferenceInputs:references}:{}),...(inputs.length?{nativePartRenderInputs:inputs}:{})};
}
function checkMetadata(recording,expected){
 assert.ok(recording,'public recording metadata exists');
 assert.equal(recording.id,expected.clipId,'metadata clip identity');
 assert.equal(recording.sha256,expected.sha256,'metadata encoded identity');
 assert.deepEqual(pick(recording,[...provenanceFields,'nativePartReferenceInputs','nativePartRenderInputs']),expectedMetadata(expected),'public metadata retains actual whole/indexed inputs');
}
const expectedByHash=new Map(expectedVariants.map(row=>[row.sha256,row]));

test('published Heiko bytes retain finite actual input provenance in manifest and catalog metadata',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../assets/voices/neighbors/heiko-manifest.json',import.meta.url),'utf8'));
 const context={window:{},location:{search:''},URLSearchParams};
 vm.runInNewContext(readFileSync(new URL('../For-AI/AUDIO-TEXT-LIBRARY.js',import.meta.url),'utf8'),context);
 const recordings=context.window.GermanySimulatorAudioText.recordings;
 assert.ok(manifest.clips.length>0,'accepted legacy/new Heiko manifest is present');
 for(const clip of manifest.clips){
  const expected=expectedByHash.get(clip.sha256);
  assert.ok(expected,'new encoded Heiko variant needs an explicit reviewed input-provenance expectation');
  checkManifest(clip,expected);
  const recording=recordings['./'+clip.file];
  checkMetadata(recording&&JSON.parse(JSON.stringify(recording)),expected);
 }
});

test('finite input receipts reject losing whole or indexed blocks even from both public surfaces',()=>{
 let wholeCases=0,partCases=0;
 for(const expected of expectedVariants){
  const metadata={id:expected.clipId,sha256:expected.sha256,...clone(expectedMetadata(expected))};
  const manifest={clipId:expected.clipId,sha256:expected.sha256,...clone(expected.whole),nativeParts:expected.parts.map(p=>({index:p.index,sourceStart:p.sourceStart,sourceEnd:p.sourceEnd,text:p.text,encodedSha256:p.encodedSha256,...clone(p.fields)}))};
  checkManifest(manifest,expected);
  checkMetadata(metadata,expected);
  for(const field of Object.keys(expected.whole)){
   const broken=clone(metadata);delete broken[field];
   assert.throws(()=>checkMetadata(broken,expected),undefined,'whole metadata field '+field);
   const lost=clone(manifest);delete lost[field];
   assert.throws(()=>checkManifest(lost,expected),undefined,'whole manifest field '+field);wholeCases++;
  }
  for(const part of expected.parts)for(const field of Object.keys(part.fields)){
   const lost=clone(manifest);delete lost.nativeParts[part.index][field];
   assert.throws(()=>checkManifest(lost,expected),undefined,'indexed manifest field '+field);
   const stripped=clone(manifest);for(const key of provenanceFields)delete stripped.nativeParts[part.index][key];
   assert.throws(()=>checkManifest(stripped,expected),undefined,'entire indexed manifest block');
  }
  for(const key of ['nativePartReferenceInputs','nativePartRenderInputs'])if(metadata[key]){
   const broken=clone(metadata);delete broken[key];
   assert.throws(()=>checkMetadata(broken,expected),undefined,'missing whole indexed metadata block');
   const wrong=clone(metadata);wrong[key][0].index+=1;
   assert.throws(()=>checkMetadata(wrong,expected),undefined,'wrong indexed metadata owner');partCases++;
  }
  const stripped=clone(metadata);
  for(const key of [...provenanceFields,'nativePartReferenceInputs','nativePartRenderInputs'])delete stripped[key];
  if(Object.keys(expectedMetadata(expected)).length)assert.throws(()=>checkMetadata(stripped,expected),undefined,'deleting every optional metadata field must fail');
 }
 assert.ok(wholeCases>=3,'actual whole excerpt variants covered');
 assert.ok(partCases>=5,'actual indexed excerpt/render variants covered');
});

test('required actual provenance cannot become optional when the entire manifest block disappears',()=>{
 for(const expected of expectedVariants){
  if(!Object.keys(expected.whole).length&&!expected.parts.length)continue;
  assert.throws(()=>checkManifest({clipId:expected.clipId,sha256:expected.sha256},expected),undefined,'known encoded bytes cannot be relabeled legacy');
 }
 const legacy=expectedVariants.filter(x=>!Object.keys(x.whole).length&&!x.parts.length);
 assert.ok(legacy.length>=20,'unchanged complete whole-take legacy receipts remain compatible');
 for(const expected of legacy){
  checkManifest({clipId:expected.clipId,sha256:expected.sha256},expected);
  checkMetadata({id:expected.clipId,sha256:expected.sha256},expected);
 }
});

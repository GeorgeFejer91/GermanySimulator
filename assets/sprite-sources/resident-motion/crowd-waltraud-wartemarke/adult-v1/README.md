# Waltraud Wartemarke adult street source

Own painted source for `street-waltraud-wartemarke` and `crowd-waltraud-wartemarke`. Silver low bun, plum wool coat, cream knit, charcoal trousers and brown lace walking shoes. Waltraud carries a burgundy folder with three cream tabs in her left hand. Her right hand is empty. The original adviser, rule ownership and voice recordings are retained.

Three unmodified built-in ImageGen paintings supply eight genuine views and two complete profile Far legs. The original request files record the prompts. The portable reference map identifies the exact existing repository bytes behind those historical paths. The generation process needs only the raw paintings and the generation inputs below.

One common 400/763 isotropic registration places the 512×512 source figure at pivot [256,472]. The paired Far parts use the source-fitted isotropic scale 0.27635616623597015. The approved continuous fields retain the stationary contact and whole cuff/boot support. The authored height is 2.33 and stride is 15.145. The independent metadata fit at Söder height 2.77 yields stride 18.005.

## Rebuild in a disposable mirror

Copy these 20 actor files from this directory into the same relative location in an initially absent mirror.

~~~text
raw-cardinals-v1.png
raw-quarters-v1.png
raw-far-legs-v1.png
prepare-neutrals-v1.py
raw-family-neutral-parts-v2.py
raw-family-neutral-controls-v1.json
raw-body-cardinal-down-v2.py
raw-body-cardinal-up-v1.py
raw-body-profile-v1.py
raw-body-actor-controls-prep-v1.json
right-full16-field-v1.py
left-full16-field-v2.py
mixed-material-helper-v3-exact-half.py
raw-body-quiet-v1.py
raw-body-quiet-controls-v1.json
raw-mouth-registrations-v1.py
raw-mouth-physical-controls-v1.json
raw-body-native-v2.py
family-routing-v1.json
rebuild-family-v1.py
~~~

Copy these five tracked mechanics to their repository-relative paths in the mirror.

~~~text
tools/build-street-character-sprites.py
.agents/skills/animate-2d-characters/scripts/painted_walk.py
.agents/skills/animate-2d-characters/scripts/harmonize_material.py
tools/build-street-mouths.py
tools/build-street-motion-delivery.py
~~~

Keep the validation baseline outside the mirror. Run the driver from the mirror root with one stage per bounded process. Use the project resource guard and its fresh memory and disk checks. Preserve the first failed run and start a separate mirror for any retry.

~~~powershell
$mirrorRoot = (Get-Location).Path
$actorDriver = 'assets/sprite-sources/resident-motion/crowd-waltraud-wartemarke/adult-v1/rebuild-family-v1.py'
python -B $actorDriver --mirror $mirrorRoot --stage register
python -B $actorDriver --mirror $mirrorRoot --stage neutral-parts
# Run each movement and action stage in the order shown below.
python -B $actorDriver --mirror $mirrorRoot --stage down-0
# Use native-desktop, native-mobile and native-standing separately.
python -B $actorDriver --mirror $mirrorRoot --stage native-desktop
# Use mouth-down, mouth-right, mouth-left and mouth-turn-actions separately.
python -B $actorDriver --mirror $mirrorRoot --stage mouth-down --compiler tools/build-street-mouths.py --compiler-sha 7d3ca1c34a6b2164f01e35bdc635f6ad03c75ec7e041878192afef21b670fc1e
# Use pack-init, pack-build, pack-bind and pack-check in that order.
python -B $actorDriver --mirror $mirrorRoot --stage pack-init --packer tools/build-street-motion-delivery.py --packer-sha 057a595ad272b9510b8148f95a39bc259bf2adf1503af53fb84b89970b211592
python -B $actorDriver --mirror $mirrorRoot --stage compare --packer tools/build-street-motion-delivery.py --packer-sha 057a595ad272b9510b8148f95a39bc259bf2adf1503af53fb84b89970b211592 --baseline $externalBaseline
~~~

Movement order is down-0, down-1, right-0 through right-3, up-0, up-1 and left-0 through left-3. Follow with idle, look, success and failure. Set $externalBaseline to the absolute path of this source package’s validation-baseline-v1.json in the original checkout before running compare.

## Comparison scope

The pack writer emits compact mouth JSON with a single trailing newline. The approved 169,471-byte file preserves all 1,290 signed-zero tokens and fits the 262,144-byte runtime fetch limit. Its authored sidecar and packet are rebound to the compact bytes before the independent selected height fit.

The separate baseline records the already verified authored output. A clean comparison checks all 328 source roles, 412 logical body cells, 256 signed movement field pairs, 64 signed quiet fields, 824 native body cells plus standing, 324 mouth slots and their 648 native bindings, and all ten authored runtime files. The typed definition fingerprint and signed zero are retained. Three rear fits are explicitly null.

Private replay reproduced the authored output byte for byte. This consolidated driver needs its own clean replay before source admission. The original art and numerical proofs do not establish in-game lip readability at small screen sizes.

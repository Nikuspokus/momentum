// Après `npx cap add android` : lien profond de connexion Google, politique de confidentialité Health Connect, minSdk 26
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const manifestPath = 'android/app/src/main/AndroidManifest.xml'
let manifest = readFileSync(manifestPath, 'utf8')
if (!manifest.includes('dev.nikuspokus.momentum')) {
  const filter = `
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="dev.nikuspokus.momentum" android:host="auth" />
            </intent-filter>
`
  // Insère le filtre dans l'activité principale (juste avant sa balise fermante)
  manifest = manifest.replace(/(<activity[^>]*\.MainActivity[\s\S]*?)(<\/activity>)/, `$1${filter}        $2`)
  if (!manifest.includes('dev.nikuspokus.momentum')) throw new Error('Impossible de patcher AndroidManifest.xml')
  writeFileSync(manifestPath, manifest)
}

const stringsPath = 'android/app/src/main/res/values/strings.xml'
let strings = readFileSync(stringsPath, 'utf8')
if (!strings.includes('health_connect_privacy_policy_url')) {
  strings = strings.replace(
    '</resources>',
    '    <string name="health_connect_privacy_policy_url">https://nikuspokus.github.io/momentum/privacy</string>\n</resources>',
  )
  writeFileSync(stringsPath, strings)
}

const varsPath = 'android/variables.gradle'
if (existsSync(varsPath)) {
  let vars = readFileSync(varsPath, 'utf8')
  vars = vars.replace(/minSdkVersion\s*=\s*\d+/, (m) => (Number(m.match(/\d+/)[0]) < 26 ? 'minSdkVersion = 26' : m))
  writeFileSync(varsPath, vars)
}
console.log('Projet Android préparé.')

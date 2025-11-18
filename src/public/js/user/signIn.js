importLinkCss('/css/layouts/signIn.css')

const client = new Appwrite.Client()
  .setEndpoint("https://syd.cloud.appwrite.io/v1")
  .setProject("68a4957600115808485e")

const account = new Appwrite.Account(client)
const databases = new Appwrite.Databases(client)

async function googleRedirect() {
  try {
    document.querySelector('button.google-sign-in').classList.add('loading')
    
    try {
      await account.get() 
      await account.deleteSession("current")
      console.log("Existing session cleared")
    } catch (err) {
      console.log("No existing session, skipping delete")
    }

    account.createOAuth2Session(
      'google', 
      'http://localhost:3000/authentication/sign-in?signin=google',
      'http://localhost:3000/failed'
    )
  } catch (error) {
    console.error('Google sign-in error:', error)
  }
}

async function checkingAccount() {
  try {
    document.querySelector('button[type="submit"]').classList.add('loading')

    const email = document.querySelector('input#email').value
    const password = document.querySelector('input#password').value
    const response = await fetch("/authentication/checking-account", {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        email: email,
        password: password
      })
    })
    
    if (!response.ok) throw new Error(`Response status: ${response.status}`)
    const {isValid, message} = await response.json()

    document.querySelector('button').classList.remove('loading')
    if (!isValid) {
      document.querySelector('p.wrong-info').textContent = message
      document.querySelector('p.wrong-info').style.color = 'red'
      return 
    } 
    document.querySelector('p.wrong-info').textContent = ''
    pushNotification(message) 

    window.isLoggedIn = true

    // getLog(
    //   topic = 'auth-update', 
    //   value = {
    //     "user_id"     : uid,
    //     "update_type" : 'login',
    //     "timestamp"   : new Date(),
    //   }
    // )

    setTimeout(() => {
      const path = window.location.origin
      window.location.replace(path + '/home')
    }, 1000)
    
    return  
  } catch (error) {
    pushNotification(`Error checking account: ${error}`) 
  }
}

window.onload = async () => {
  const params = new URLSearchParams(window.location.search)
  const signin = params.get("signin")

  if (signin === "google") {
    try {
      const user = await account.get()
      pushNotification("Checking account")

      const response = await fetch("/authentication/checking-google-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
        }),
      })
      if (!response.ok) throw new Error(`Response status: ${response.status}`)
      const {isValid, message} = await response.json()

      if (!isValid) {
        document.querySelector('p.wrong-info').textContent = message
        document.querySelector('p.wrong-info').style.color = 'red'
        return 
      } 
      document.querySelector('p.wrong-info').textContent = ''
      pushNotification(message) 

      window.isLoggedIn = true

      setTimeout(() => {
        const path = window.location.origin
        window.location.replace(path + '/home')
      }, 1000)

    } catch (err) {
      console.error("Failed to get user:", err)
    }
  }
}

document.querySelector("form").addEventListener("submit", function(event) {
  event.preventDefault()
})

document.querySelector("button[type='submit']").addEventListener("click", checkingAccount)

document.querySelector("button.google-sign-in").addEventListener("click", googleRedirect)
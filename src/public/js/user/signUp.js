importLinkCss('/css/layouts/signIn.css')

const submitButton = document.querySelector('button')

async function verifyingEmail(email) {
  try {
    const response = await fetch("/authentication/sign-up/verifying-email", {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        email: email,
      })
    })
    if (!response.ok) throw new Error(`Response status: ${response.status}`)
    const json = await response.json()
    return { isValid: json.isValid, message: json.message }
  } catch (error) {
    pushNotification(`Error verifying email: ${error}`)
  }
}

async function verifyingCode(email, code) {
  try {
    const response = await fetch('/authentication/sign-up/verifying-code', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        email: email,
        code : code
      })
    })
    if (!response.ok) throw new Error(`Response status: ${response.status}`)
    const json = await response.json()
    return json.message
  } catch (error) {
    pushNotification(`Error verifying code: ${error}`) 
  }
}

async function creatingAccount(email, name, password, gender, dob) {
  try {
    const response = await fetch('/authentication/creating-account', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        email    : email,
        name     : name,
        password : password,
        gender   : gender,
        dob      : dob
      })
    })
    if (!response.ok) throw new Error(`Response status: ${response.status}`)
    const {isSuccessful, message} = await response.json()
    return { isSuccessful: isSuccessful, message: message }
  } catch (error) {
    pushNotification(`Error creating account: ${error}`)
  }
}

submitButton.onclick = async function() {
  submitButton.classList.add('loading')
  if (submitButton.className.includes('email')) {
    const email = document.querySelector('input#email').value
    if (email.trim() === '') {
      document.querySelector('p.wrong-info').textContent = 'Email cannot be empty'
      document.querySelector('p.wrong-info').style.color = 'red'
      submitButton.classList.remove('loading')
      return
    }
    const {isValid, message} = await verifyingEmail(email) 
    if (!isValid) {
      document.querySelector('p.wrong-info').textContent = message
      document.querySelector('p.wrong-info').style.color = 'red'

      submitButton.classList.remove('loading')
      return
    }
    
    document.querySelector('input#email').setAttribute('disabled', true)
    document.querySelector('p.wrong-info').textContent = message
    document.querySelector('p.wrong-info').style.color = 'green'

    const inputCode = document.createElement('input')
    inputCode.type  = 'text'
    inputCode.placeholder = 'Enter verification code'
    inputCode.name  = 'code'

    document.querySelector('div[class="form-group code"]').style.display = ''
    document.querySelector('div[class="form-group code"]').appendChild(inputCode)

    submitButton.innerText = 'Send Verification Code'
    submitButton.className = 'submit-code'
    submitButton.classList.remove('loading')
    return
  }
  if (submitButton.className.includes('code')) {
    const email = document.querySelector('input#email').value
    const code = document.querySelector('input[name="code"]').value
    const isVerify = await verifyingCode(email, code)
    if (!isVerify) {
      document.querySelector('p.wrong-info').textContent = 'Code is incorrect'
      document.querySelector('p.wrong-info').style.color = 'red'
      submitButton.classList.remove('loading')
      return
    }

    document.querySelector('input[name="code"]').remove()

    const name = document.createElement('input')
    name.type  = 'text'
    name.placeholder = 'Enter your name'
    name.name  = 'name'

    const password = document.createElement('input')
    password.type  = 'password'
    password.placeholder = 'Enter new password'
    password.name  = 'password'

    const genderMale = document.createElement('input')
    genderMale.type = 'radio'
    genderMale.name = 'gender'
    genderMale.value = 'male'

    const labelMale = document.createElement('label')
    labelMale.textContent = 'Male'

    const genderFemale = document.createElement('input')
    genderFemale.type = 'radio'
    genderFemale.name = 'gender'
    genderFemale.value = 'female'

    const labelFemale = document.createElement('label')
    labelFemale.textContent = 'Female'

    const dob = document.createElement('input')
    dob.type = 'date'
    dob.name = 'dob'

    const confirmPassword = document.createElement('input')
    confirmPassword.type  = 'password'
    confirmPassword.placeholder = 'Confirm password'
    confirmPassword.name  = 'confirm-password'

    document.querySelector('div[class="form-group name"]').style.display = ''
    document.querySelector('div[class="form-group name"]').appendChild(name)

    const genderContainer = document.querySelector('div.form-group.gender')
    genderContainer.style.display = 'flex'
    genderContainer.style.alignItems = 'center'
    genderContainer.style.gap = '10px'
    genderContainer.appendChild(genderMale)
    genderContainer.appendChild(labelMale)
    genderContainer.appendChild(genderFemale)
    genderContainer.appendChild(labelFemale)

    document.querySelector('div.form-group.dob').style.display = ''
    document.querySelector('div.form-group.dob').appendChild(dob)

    document.querySelector('div[class="form-group password"]').style.display = ''
    document.querySelector('div[class="form-group password"]').appendChild(password)
    
    document.querySelector('div[class="form-group confirm-password"]').style.display = ''
    document.querySelector('div[class="form-group confirm-password"]').appendChild(confirmPassword)

    submitButton.innerText = 'Confirm'
    submitButton.className = 'submit-password'
    submitButton.classList.remove('loading')

    document.querySelector('p.wrong-info').textContent = ''
    return
  }
  if (submitButton.className.includes('password')) {
    const email    = document.querySelector('input[name="email"]').value
    const name     = document.querySelector('input[name="name"]').value
    const gender   = document.querySelector('input[name="gender"]:checked').value
    const dob      = document.querySelector('input[name="dob"]').value
    const password = document.querySelector('input[name="password"]').value
    const confirmPassword = document.querySelector('input[name="confirm-password"]').value

    if (name.trim() === '' || gender.trim() === '' || dob.trim() === '') {
      submitButton.classList.remove('loading')
      return pushNotification('Please fill in all required fields')
    }

    if (password.trim() === '') {
      submitButton.classList.remove('loading')
      return pushNotification('Password cannot be empty')
    }
    if (password !== confirmPassword) {
      submitButton.classList.remove('loading')
      return pushNotification('Passwords do not match')
    }

    const {isSuccessful, message} = await creatingAccount(email, name, password, gender, dob)
    if (isSuccessful) {
      document.querySelector('p.wrong-info').textContent = ''
      pushNotification(message)

      setTimeout(() => {
        window.location.replace(window.location.origin + '/authentication/sign-in')
      }, 1000)
    } 

    submitButton.classList.remove('loading')
    return
  }
}
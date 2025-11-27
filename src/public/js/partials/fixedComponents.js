const scrollTop   = document.querySelector('div.scroll-to-top-icon')
const dropup      = document.querySelector('div.dropup')
const chat        = document.querySelector('div.chat-icon')
const AIchat      = document.querySelector('div.chatbot-icon')

const chatBox     = document.querySelector('div.chat-box')
const minimize    = chatBox.querySelector('div.minimize')
const chatHeader  = chatBox.querySelector('div.chat-header')
const chatBody    = chatBox.querySelector('div.chat-body')
const chatContent = chatBox.querySelector('ul.chat-content')
const input       = chatBox.querySelector('textarea.input')
const sendBtn     = chatBox.querySelector('div.send-btn')
const notLoggedIn = chatBox.querySelector('div.not-logged-in')
const form        = chatBox.querySelector('form.input-form')

const AIchatBox     = document.querySelector('div.ai-chat-box')
const AIminimize    = AIchatBox.querySelector('div.minimize')
const AIchatHeader  = AIchatBox.querySelector('div.chat-header')
const AIchatBody    = AIchatBox.querySelector('div.chat-body')
const AIchatContent = AIchatBox.querySelector('ul.chat-content')
const AIinput       = AIchatBox.querySelector('textarea.input')
const AIsendBtn     = AIchatBox.querySelector('div.send-btn')
const AInotLoggedIn = AIchatBox.querySelector('div.not-logged-in')
const AIform        = AIchatBox.querySelector('form.input-form')

checkUser()

async function checkUser() {
  // Wait until window.isLoggedIn is assigned
  while (typeof window?.isLoggedIn === 'undefined') {
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  if (window.isLoggedIn) {
    chatBody.style.display     = ''
    AIchatBody.style.display   = ''
    chatHeader.style.opacity   = '1'
    AIchatHeader.style.opacity = '1'
    socket.emit('joinRoom', {id: window.uid, room: window.uid})
  }
}

window.addEventListener('scroll', function() {
  document.documentElement.scrollTop >= 1000 ? scrollTop.style.display = "" : scrollTop.style.display = "none"
})
scrollTop.onclick = function() {
  window.scrollTo({top: 0, behavior: "smooth"})
}

async function getChatData() {
  try {
    const response = await fetch(`/api/chat/${window.uid}`)
    if (!response.ok) throw new Error(`Response status: ${response.status}`)

    const json = await response.json();
    const messages = json.data
    if (messages.length === 0) return
    chatContent.replaceChildren()
    messages.forEach((message) => {
      const chat = document.createElement('li')
      const date = document.createElement('li')

      chat.textContent = message.content 
      date.textContent = formatDateTime(message.createdAt)
      date.style.display = 'none'

      chat.onclick = function() {
        date.style.display === 'none' ? date.style.display = 'block' : date.style.display = 'none'
      }

      if (message.senderId === window.uid) {
        chat.setAttribute('class', 'right-content')
        date.setAttribute('class', 'right-date')
      } else {
        chat.setAttribute('class', 'left-content')
        date.setAttribute('class', 'left-date')
      }
 
      chatContent.appendChild(chat)
      chatContent.appendChild(date)
    })
    chatContent.scrollTo(0, chatContent.scrollHeight)
  } catch (error) {
    console.error("Error fetching chat data:", error)
  }
}
async function getAIChatData() {
  try {
    const response = await fetch(`/api/chat/ai/${window.uid}`)
    if (!response.ok) throw new Error(`Response status: ${response.status}`)

    const json = await response.json();
    const messages = json.data
    if (messages.length === 0) return
    AIchatContent.replaceChildren()
    messages.forEach((message) => {
      const chat = document.createElement('li')
      chat.textContent = message.content 
      message.senderId === window.uid ? chat.setAttribute('class', 'right-content') : chat.setAttribute('class', 'left-content')
        
      AIchatContent.appendChild(chat)
    })
    AIchatContent.scrollTo(0, AIchatContent.scrollHeight)
  } catch (error) {
    console.error("Error fetching chat data:", error)
  }
}

// icon 
chat.onclick = function() {
  const isAIOpen = AIchatBox.style.display === 'block'

  if (chatBox.style.display === 'none') {
    chatBox.style.display = 'block'
    chatBox.style.right = isAIOpen ? '425px' : '80px'

    if (window.isLoggedIn) getChatData()
  } else {
    chatBox.style.display = 'none'
  }
}

AIchat.onclick = function() {
  const isChatOpen = chatBox.style.display === 'block'

  if (AIchatBox.style.display === 'none') {
    AIchatBox.style.display = 'block'
    AIchatBox.style.right = isChatOpen ? '425px' : '80px'

    if (window.isLoggedIn) getAIChatData()
  } else {
    AIchatBox.style.display = 'none'
  }
}

// minimize button
minimize.onclick = function () {
  chatBox.style.display = 'none'
  chatBox.style.right === '60px' ? isUsed = false : isUsed = true
} 
AIminimize.onclick = function () {
  AIchatBox.style.display = 'none'
  AIchatBox.style.right === '60px' ? isUsed = false : isUsed = true
} 
  
// send message
sendBtn.onclick = async function() {
  try {
    if (input.value.trim() !== '') {
      const prompt = input.value
      input.value = ''
      sendBtn.classList.add('not-allowed')
      socket.emit('privateMessage', { room: window.uid, message: `${window.uid}:${prompt}` })
      const response = await fetch('/api/chat/create', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({value: prompt})
      })
      input.value = ''
      if (!response.ok) throw new Error(`Response status: ${response.status}`)
      chatContent.scrollTo(0, chatContent.scrollHeight)
    }
  } catch (error) {
    console.log(error)
  }
}
AIsendBtn.onclick = async function() {
  if (AIinput.value.trim() !== '') {
    const prompt = AIinput.value
    AIinput.value = ''
    AIsendBtn.classList.add('not-allowed')

    const chat = document.createElement('li')
    chat.textContent = prompt
    AIchatContent.appendChild(chat)
    chat.classList.add('right-content')

    const answer = document.createElement('li')
    answer.textContent = 'Loading...'
    answer.classList.add('left-content')
    AIchatContent.appendChild(answer)
    AIchatContent.scrollTo(0, AIchatContent.scrollHeight)

    const response = await fetch('/api/chat/ai/create', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({prompt: prompt})
    })
    AIinput.value = ''
    if (!response.ok) throw new Error(`Response status: ${response.status}`)
    const json = await response.json()

    answer.textContent = json.answer
    AIchatContent.scrollTo(0, AIchatContent.scrollHeight)
  }
}

// input event
input.addEventListener('input', function() {
  if (input.value.trim() !== '') sendBtn.classList.remove('not-allowed') 
  else sendBtn.classList.add('not-allowed')
})
AIinput.addEventListener('input', function() {
  if (AIinput.value.trim() !== '') AIsendBtn.classList.remove('not-allowed') 
  else AIsendBtn.classList.add('not-allowed')
})

// submit event
input.addEventListener("keypress", function(event) {
  if (event.key === "Enter" && input.value.trim() !== '') {
    sendBtn.click()
  }
})
AIinput.addEventListener("keypress", function(event) {
  if (event.key === "Enter" && AIinput.value.trim() !== '') {
    AIsendBtn.click()
  }
})


socket.on('chat-message', async function(id, msg, room) {
  const chat = document.createElement('li')
  const date = document.createElement('li')
  
  chat.textContent = msg
  date.textContent = formatDateTime(new Date())
  date.style.display = 'none'

  chat.onclick = function() {
    date.style.display === 'none' ? date.style.display = 'block' : date.style.display = 'none'
  }

  if (id.trim() === window.uid) {
    chat.setAttribute('class', 'right-content')
    date.setAttribute('class', 'right-date')
  } else {
    chat.setAttribute('class', 'left-content')
    date.setAttribute('class', 'left-date')
  }

  chatContent.appendChild(chat)
  chatContent.appendChild(date)
  chatContent.scrollTo(0, chatContent.scrollHeight)

  const response = await fetch('/data/notification', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      message: msg,
      type: 'message',
      userId: id
    })
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
})
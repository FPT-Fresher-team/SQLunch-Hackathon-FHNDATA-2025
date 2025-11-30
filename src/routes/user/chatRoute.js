require('dotenv').config()
const express = require('express')
const router = express.Router()
const chat = require('../../app/models/chatModel')
const aiChat = require('../../app/models/aiChatModel')
const message = require('../../app/models/messageModel')
const ragChatService = require('../../app/services/ragChatService')

router.use(express.json())

// ============================================================================
// Regular Chat Routes (User-to-User)
// ============================================================================
router.get('/:id', async function(req, res) {
  const chatRoom = await chat.findOne({ userId: req.params.id }).lean()
  if (!chatRoom) return res.json({data: []})

  const chatMessages = await message.find({ chatId: chatRoom._id }).sort({createdAt: 1}).lean()
  return res.json({data: chatMessages})
})

router.post('/create', async function(req, res) {
  const chatRoom = await chat.findOne({ userId: req.cookies.uid }).lean()
  const newMessage = new message({
    chatId  : chatRoom._id,
    senderId: req.cookies.uid,
    content : req.body.value
  })
  await chat.updateOne({_id: chatRoom._id}, {
    updatedAt   : new Date(),
    lastMessage : req.body.value
  })
  await newMessage.save()
  return res.json({message: 'save successfully'})
})

// ============================================================================
// AI Chat Routes (RAG-based)
// ============================================================================

/**
 * Get AI chat history
 */
router.get('/ai/:id', async function(req, res) {
  try {
    const chatRoom = await aiChat.findOne({ userId: req.params.id }).lean()
    if (!chatRoom) return res.json({data: []})

    const chatMessages = await message.find({ chatId: chatRoom._id }).sort({createdAt: 1}).lean()
    return res.json({data: chatMessages})
  } catch (error) {
    console.error('Error fetching AI chat history:', error)
    return res.status(500).json({error: 'Failed to fetch chat history'})
  }
})

/**
 * Create AI chat message with RAG retrieval
 * 
 * Body:
 *   - prompt (string): User query
 *   - topK (number, optional): Number of documents to retrieve (default: 5)
 */
router.post('/ai/create', async function(req, res) {
  try {
    const query = req.body.prompt?.trim()
    if (!query) {
      return res.status(400).json({error: 'Prompt cannot be empty'})
    }

    // Get AI chat room
    const chatRoom = await aiChat.findOne({ userId: req.cookies.uid }).lean()
    if (!chatRoom) {
      return res.status(404).json({error: 'Chat room not found'})
    }

    // Save user message
    const userMessage = new message({
      chatId: chatRoom._id,
      senderId: req.cookies.uid,
      content: query
    })
    await userMessage.save()

    // Call RAG chatbot
    let answer = 'Xin lỗi, có lỗi xảy ra khi xử lý câu hỏi của bạn.'
    let sources = []

    try {
      const ragResponse = await ragChatService.chatQuery(
        query,
        req.cookies.uid,
        req.body.topK || 5
      )
      answer = ragResponse.answer
      sources = ragChatService.formatSources(ragResponse.sources)
    } catch (ragError) {
      console.error('RAG service error:', ragError.message)
      answer = 'Xin lỗi, dịch vụ chatbot đang tạm thời không khả dụng. Vui lòng thử lại sau.'
    }

    // Convert Markdown to HTML for display
    const answerHtml = ragChatService.markdownToHtml(answer)

    // Save bot response
    const botMessage = new message({
      chatId: chatRoom._id,
      senderId: 'rag-bot',
      content: answerHtml,
      metadata: {
        sources: sources,
        originalMarkdown: answer
      }
    })
    await botMessage.save()

    return res.json({
      answer: answerHtml,
      answerMarkdown: answer,
      sources: sources,
      messageId: botMessage._id
    })
  } catch (error) {
    console.error('AI chat error:', error)
    return res.status(500).json({error: 'Failed to process chat request'})
  }
})

module.exports = router
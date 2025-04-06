"use client"

import { useState, useRef, useEffect } from "react"
import { SendHorizontal, Sparkles, Code, RotateCw, AlertCircle } from "lucide-react"

interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
  timestamp: number
  implementable?: boolean
}

interface DesignChatProps {
  onImplementDesign: (summary: string) => void
}

export function DesignChat({ onImplementDesign }: DesignChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hi! I'm your design assistant. Describe your design ideas and I'll help refine them. When you're ready, click 'Implement' on any of my suggestions to generate a 3D model.",
      timestamp: Date.now(),
      implementable: false
    }
  ])
  const [input, setInput] = useState("")
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [designSummary, setDesignSummary] = useState<string | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim() || isTyping) return
    
    // Clear any previous error
    setErrorMessage(null)
    
    // Add user message
    const userMessage: ChatMessage = {
      role: "user",
      content: input,
      timestamp: Date.now()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsTyping(true)
    
    try {
      // Format messages for API - only include role and content
      const formattedMessages = messages.concat(userMessage).map(msg => ({
        role: msg.role,
        content: msg.content
      }))
      
      console.log('Sending chat request with messages:', formattedMessages.length)
      
      // Call backend for AI response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: formattedMessages })
      })
      
      // Handle error response
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('API error:', errorData)
        throw new Error(errorData.error || `Error ${response.status}: Failed to get chat response`)
      }
      
      const data = await response.json()
      
      if (!data.content) {
        throw new Error('No content in response')
      }
      
      // Add AI response
      const aiMessage: ChatMessage = {
        role: "assistant",
        content: data.content,
        timestamp: Date.now(),
        implementable: true
      }
      
      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred'
      setErrorMessage(errorMsg)
      
      // Add error message
      setMessages(prev => [
        ...prev, 
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          timestamp: Date.now(),
          implementable: false
        }
      ])
    } finally {
      setIsTyping(false)
    }
  }

  const handleImplementDesign = async (messageIndex: number) => {
    setIsGeneratingSummary(true)
    setDesignSummary(null)
    setErrorMessage(null)
    
    try {
      // Get all messages up to and including the selected message
      const relevantConversation = messages.slice(0, messageIndex + 1)
      
      // Format messages for API - only include role and content
      const formattedConversation = relevantConversation.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
      
      console.log('Generating summary from conversation with messages:', formattedConversation.length)
      
      // Call backend to generate summary
      const response = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation: formattedConversation })
      })
      
      // Handle error response
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('API error:', errorData)
        throw new Error(errorData.error || `Error ${response.status}: Failed to generate design summary`)
      }
      
      const data = await response.json()
      
      if (!data.summary) {
        throw new Error('No summary in response')
      }
      
      setDesignSummary(data.summary)
      
    } catch (error) {
      console.error('Error generating design summary:', error)
      
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred'
      setErrorMessage(errorMsg)
      setDesignSummary("Error generating design summary. Please try again.")
    } finally {
      setIsGeneratingSummary(false)
    }
  }

  const confirmImplementation = () => {
    if (designSummary) {
      onImplementDesign(designSummary)
      setDesignSummary(null)
      
      // Add confirmation message
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: `I'm generating a 3D model based on our discussion. The design summary is: "${designSummary}"`,
          timestamp: Date.now(),
          implementable: false
        }
      ])
    }
  }

  const dismissError = () => {
    setErrorMessage(null)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Error message display */}
      {errorMessage && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-2">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm">{errorMessage}</p>
            </div>
            <button onClick={dismissError} className="ml-auto text-red-500 hover:text-red-700">
              &times;
            </button>
          </div>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div 
              key={message.timestamp} 
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div 
                className={`max-w-[80%] rounded-xl p-3 ${
                  message.role === "user" 
                    ? "bg-[#558eff] text-white" 
                    : "bg-[#f5f5f5] text-black"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="flex items-center mb-2">
                    <Sparkles size={14} className="text-[#558eff] mr-1" />
                    <span className="text-xs font-medium text-[#558eff]">DESIGN ASSISTANT</span>
                  </div>
                )}
                
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                
                {message.role === "assistant" && message.implementable && (
                  <button
                    onClick={() => handleImplementDesign(index)}
                    className="mt-2 text-xs bg-[#558eff] text-white px-2 py-1 rounded flex items-center"
                  >
                    <Code size={12} className="mr-1" />
                    Implement
                  </button>
                )}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-[#f5f5f5] rounded-xl p-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Input area */}
      <div className="border-t p-4">
        <div className="flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !isTyping && handleSendMessage()}
            placeholder="Describe your design idea..."
            className="flex-1 border rounded-l-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-[#558eff]"
            disabled={isTyping}
          />
          <button
            onClick={handleSendMessage}
            className="bg-[#558eff] text-white p-2 rounded-r-md disabled:bg-gray-400"
            disabled={!input.trim() || isTyping}
          >
            <SendHorizontal size={18} />
          </button>
        </div>
      </div>
      
      {/* Design summary modal */}
      {designSummary !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full">
            <h3 className="text-lg font-bold mb-4">Design Summary</h3>
            {isGeneratingSummary ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin mr-2">
                  <RotateCw size={24} />
                </div>
                <p>Generating summary...</p>
              </div>
            ) : (
              <>
                <p className="mb-6">{designSummary}</p>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setDesignSummary(null)}
                    className="px-4 py-2 border rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmImplementation}
                    className="px-4 py-2 bg-[#558eff] text-white rounded"
                  >
                    Generate 3D Model
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
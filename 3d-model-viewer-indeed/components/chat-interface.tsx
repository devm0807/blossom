"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { RefreshCw, Image, Sparkles, Palette, ShirtIcon as TShirt, RotateCw } from "lucide-react"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
  options?: {
    type: "color" | "pattern" | "model" | "image"
    value: string
    label: string
  }[]
  images?: {
    url: string
    caption: string
  }[]
}

interface ChatInterfaceProps {
  messages: ChatMessage[]
  onSendMessage: (message: string) => void
  onOptionSelect?: (option: { type: string; value: string; label: string }) => void
}

export function ChatInterface({ messages, onSendMessage, onOptionSelect }: ChatInterfaceProps) {
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    // Call the parent component handler
    onSendMessage(input)

    // Clear input
    setInput("")
  }

  const handleImageUpload = () => {
    fileInputRef.current?.click()
  }

  const handleOptionSelect = (option: { type: string; value: string; label: string }) => {
    // Call the parent component handler if provided
    if (onOptionSelect) {
      onOptionSelect(option)
    } else {
      // Add user selection as a message
      onSendMessage(`I choose the ${option.label} option.`)
    }
  }

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className="flex-1 flex flex-col bg-white">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-6 max-w-full">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-fadeIn`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 ${
                  message.role === "user" ? "bg-[#558eff] text-white ml-4" : "bg-[#f5f5f5] text-[#1e1e1e] mr-4"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="flex items-center mb-2">
                    <Sparkles size={16} className="text-[#558eff] mr-2" />
                    <span className="text-xs font-medium text-[#558eff]">AI ASSISTANT</span>
                  </div>
                )}

                <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>

                {/* Display images if available */}
                {message.images && message.images.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.images.map((img, imgIndex) => (
                      <div key={imgIndex} className="relative group">
                        <img
                          src={img.url || "/placeholder.svg"}
                          alt={img.caption}
                          className="rounded-md border border-[#e5e7eb] max-w-[120px] h-auto cursor-pointer hover:opacity-90 transition-opacity"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="bg-black/50 text-white p-1 rounded-full" title="Apply to 3D model">
                            <RotateCw size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Display options if available */}
                {message.options && message.options.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.options.map((option, optIndex) => (
                      <button
                        key={optIndex}
                        onClick={() => handleOptionSelect(option)}
                        className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-[#e5e7eb] hover:bg-[#f9fafb] transition-colors"
                      >
                        {option.type === "color" && (
                          <span
                            className="w-3 h-3 rounded-full mr-1.5"
                            style={{ backgroundColor: option.value }}
                          ></span>
                        )}
                        {option.type === "pattern" && <Palette size={12} className="mr-1.5" />}
                        {option.type === "model" && <TShirt size={12} className="mr-1.5" />}
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}

                {message.role === "assistant" && (
                  <div className="flex items-center mt-2">
                    <button className="flex items-center text-xs text-[#6b7280] hover:text-[#374151] transition-colors">
                      <RefreshCw size={12} className="mr-1" />
                      <span>Regenerate</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-4 border-t border-[#e5e7eb]">
        <form onSubmit={handleSubmit} className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#9ca3af]">
            {/* GenAI star icon */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI"
            className="w-full pl-10 pr-12 py-2 rounded-full border border-[#e5e7eb] focus:outline-none focus:ring-1 focus:ring-[#558eff] text-sm"
          />

          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <button
              type="button"
              onClick={handleImageUpload}
              className="text-[#9ca3af] hover:text-[#6b7280] transition-colors"
            >
              <Image size={16} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                // Handle image upload logic
                console.log("Image selected:", e.target.files?.[0])
                // You would typically upload this to your backend
                // and then generate a 3D model from it
              }}
            />
          </div>
        </form>
      </div>
    </div>
  )
}


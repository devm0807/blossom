from groq import Groq
import re
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Groq client
client = Groq(api_key="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")

# Function to remove thinking sections
def remove_thinking_sections(text):
    """Remove any content between <think> and </think> tags"""
    if text is None:
        return ""
    return re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL).strip()

# Chat system prompt
CHAT_PROMPT = """You are a fashion and 3D design expert. Help users refine their design ideas by suggesting improvements, asking clarifying questions, and offering creative suggestions. Focus on:
- Visual design elements
- Color schemes and patterns
- Material suggestions
- Styling options
- Practical considerations

Keep your responses helpful, specific, and tailored to the user's request."""

def get_chat_response(messages):
    """Get a response from the chatbot based on conversation history"""
    try:
        # Add system prompt if not already present
        has_system_message = any(msg.get('role') == 'system' for msg in messages)
        
        formatted_messages = messages.copy()
        if not has_system_message:
            # Insert system message at the beginning
            formatted_messages.insert(0, {
                "role": "system",
                "content": CHAT_PROMPT
            })
        
        # Ensure all messages have valid roles (user, assistant, or system)
        for msg in formatted_messages:
            if 'role' not in msg or msg['role'] not in ['user', 'assistant', 'system']:
                logger.warning(f"Invalid message role: {msg.get('role', 'missing')}. Defaulting to 'user'")
                msg['role'] = 'user'
            
            # Ensure content is present
            if 'content' not in msg or not msg['content']:
                msg['content'] = "No content provided"
        
        logger.info(f"Sending {len(formatted_messages)} messages to Groq API")
        logger.info(f"First few messages: {formatted_messages[:2]}")
        
        response = client.chat.completions.create(
            model="deepseek-r1-distill-llama-70b",
            messages=formatted_messages,
            temperature=0.7,
            max_tokens=1024,
            top_p=0.9
        )
        
        # Get the content and remove any thinking sections
        content = response.choices[0].message.content
        filtered_content = remove_thinking_sections(content)
        
        logger.info(f"Received response from Groq API. Length: {len(filtered_content)} chars")
        
        return {
            "content": filtered_content,
            "usage": response.usage.prompt_tokens + response.usage.completion_tokens
        }
    except Exception as e:
        logger.error(f"Error in chat_service.get_chat_response: {str(e)}", exc_info=True)
        return {"error": f"Chat service error: {str(e)}"}

def generate_design_summary(conversation):
    """Generate a concise design summary based on the conversation history"""
    summary_prompt = """Based on this conversation, create a concise 50-word description for generating a 3D model. Focus only on key visual elements, materials, colors, and design features:

{conversation}

Create a 50-word summary focusing only on concrete design elements:"""
    
    try:
        # Format conversation
        conversation_text = "\n\n".join([
            f"{msg.get('role', 'unknown')}: {msg.get('content', 'No content')}" 
            for msg in conversation
        ])
        
        logger.info(f"Generating design summary from {len(conversation)} messages")
        
        response = client.chat.completions.create(
            model="deepseek-r1-distill-llama-70b",
            messages=[{
                "role": "user", 
                "content": summary_prompt.format(conversation=conversation_text)
            }],
            temperature=0.6,
            max_tokens=1024,
            top_p=0.9
        )
        
        # Get the summary and remove any thinking sections
        summary = response.choices[0].message.content
        filtered_summary = remove_thinking_sections(summary)
        
        logger.info(f"Generated design summary. Length: {len(filtered_summary)} chars")
        
        return {
            "summary": filtered_summary,
            "usage": response.usage.prompt_tokens + response.usage.completion_tokens
        }
    except Exception as e:
        logger.error(f"Error in chat_service.generate_design_summary: {str(e)}", exc_info=True)
        return {"error": f"Summary generation error: {str(e)}"}
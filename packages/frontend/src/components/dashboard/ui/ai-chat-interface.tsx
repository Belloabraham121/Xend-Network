"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, Bot, User, Loader2 } from "lucide-react";
import { useAccount } from 'wagmi';
import { formatAIResponse } from '@/lib/markdown-converter';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface AIChatInterfaceProps {
  onSendMessage: (message: string, userAddress?: string) => Promise<string>;
  className?: string;
}

export function AIChatInterface({ onSendMessage, className }: AIChatInterfaceProps) {
  const { address } = useAccount();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m your AI investment advisor. I can analyze your supported tokens, provide market insights, and give investment recommendations based on your portfolio. What would you like to know about your portfolio?',
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const aiResponse = await onSendMessage(inputValue, address);
      
      // Convert markdown response to plain text
      const formattedResponse = formatAIResponse(aiResponse);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: formattedResponse,
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Card className={`bg-gray-950/80 backdrop-blur-sm border-gray-800 ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          AI Investment Advisor
        </CardTitle>
        <p className="text-gray-400 text-sm">
          Ask me about your tokens, market analysis, or investment strategies
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Messages Container */}
        <div className="h-96 overflow-y-auto space-y-4 p-4 bg-gray-900/30 rounded-lg border border-gray-800">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-3 ${
                message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                message.sender === 'user' 
                  ? 'bg-blue-500/20 text-blue-400' 
                  : 'bg-green-500/20 text-green-400'
              }`}>
                {message.sender === 'user' ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>
              <div className={`flex-1 max-w-[80%] ${
                message.sender === 'user' ? 'text-right' : 'text-left'
              }`}>
                <div className={`inline-block p-3 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-blue-500/20 text-blue-100 border border-blue-500/30'
                    : 'bg-gray-800/50 text-gray-100 border border-gray-700'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          ))}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-green-500/20 text-green-400">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="inline-block p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Analyzing your request...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your tokens, market trends, or investment advice..."
            disabled={isLoading}
            className="flex-1 bg-gray-900/50 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInputValue('What tokens do I have and which ones should I invest in?')}
            disabled={isLoading}
            className="text-xs bg-gray-900/50 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            Analyze My Tokens
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInputValue('Show me the current market trends for RWA tokens')}
            disabled={isLoading}
            className="text-xs bg-gray-900/50 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            Market Trends
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInputValue('Give me investment recommendations based on my portfolio')}
            disabled={isLoading}
            className="text-xs bg-gray-900/50 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            Investment Advice
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
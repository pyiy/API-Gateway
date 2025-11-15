'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface CaptchaProps {
  value: string
  onChange: (value: string) => void
  onValidate: (isValid: boolean) => void
  onAnswerChange?: (answer: number) => void
}

export function Captcha({ value, onChange, onValidate, onAnswerChange }: CaptchaProps) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState(0)

  useEffect(() => {
    generateCaptcha()
  }, [])

  useEffect(() => {
    const isValid = parseInt(value) === answer
    onValidate(isValid)
  }, [value, answer, onValidate])

  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1
    const num2 = Math.floor(Math.random() * 10) + 1
    const operations = ['+', '-']
    const operation = operations[Math.floor(Math.random() * operations.length)]
    
    let result = 0
    let questionText = ''
    
    if (operation === '+') {
      result = num1 + num2
      questionText = `${num1} + ${num2} = ?`
    } else {
      result = num1 - num2
      questionText = `${num1} - ${num2} = ?`
    }
    
    setQuestion(questionText)
    setAnswer(result)
    if (onAnswerChange) {
      onAnswerChange(result)
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="captcha">验证码</Label>
      <div className="flex gap-2 items-center">
        <div className="flex-1 bg-muted px-4 py-2 rounded-md text-center font-mono text-lg">
          {question}
        </div>
        <Input
          id="captcha"
          type="number"
          placeholder="答案"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-24"
        />
      </div>
    </div>
  )
}

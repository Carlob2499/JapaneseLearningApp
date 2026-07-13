import { describe, it, expect } from 'vitest'
import { classifyRegister } from './register'

describe('classifyRegister', () => {
  it('labels です/ます endings polite (incl. the common ございます greeting)', () => {
    for (const s of [
      '学生です。',
      '何ですか。',
      '学びます。',
      '行きました。',
      '来ません。',
      '見てください。',
      'ありがとうございます。',
    ]) {
      expect(classifyRegister(s)).toBe('polite')
    }
  })

  it('labels casual particles / imperatives / slang casual', () => {
    for (const s of ['行くよ。', 'そうだね。', '寝るぞ！', 'やめろ！', 'まじで？', 'なんで？']) {
      expect(classifyRegister(s)).toBe('casual')
    }
  })

  it('labels humble keigo (謙譲語)', () => {
    for (const s of ['明日伺います。', 'そう申します。', '拝見しました。']) {
      expect(classifyRegister(s)).toBe('keigo_humble')
    }
  })

  it('labels respectful keigo (尊敬語) before its own ます ending', () => {
    for (const s of ['先生がいらっしゃいます。', '何とおっしゃいましたか。', '召し上がってください。']) {
      expect(classifyRegister(s)).toBe('keigo_respectful')
    }
  })

  it('labels the formal service copula', () => {
    for (const s of ['こちらでございます。', '担当の田中でございます。']) {
      expect(classifyRegister(s)).toBe('service_script')
    }
  })

  it('labels neutral plain declaratives plain', () => {
    for (const s of ['私は学生だ。', '本を読む。', '雨が降った。']) {
      expect(classifyRegister(s)).toBe('plain')
    }
  })
})

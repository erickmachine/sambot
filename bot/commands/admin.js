// ============================================================
//  DEMIBOT - ADMIN COMMANDS
// ============================================================

import * as db from '../lib/database.js'
import { mention, botHeader, botFooter, extractNumber } from '../lib/utils.js'

export async function handleAdmin(ctx) {
  const {
    sock,
    cmd,
    args,
    groupId,
    sender,
    grpSettings,
    groupMeta,
    isGroupAdmin,
    isBotAdmin,
    permLevel
  } = ctx

  // Apenas admin pode usar
  if (permLevel < 2) {
    return sock.sendMessage(groupId, {
      text: `${botHeader('SEM PERMISSAO')}\nApenas administradores podem usar este comando.${botFooter()}`
    })
  }

  // ============================================================
  // BAN
  // ============================================================
  if (['ban', 'band'].includes(cmd)) {
    if (!isBotAdmin)
      return sock.sendMessage(groupId, { text: 'Preciso ser admin para remover membros.' })

    const mentioned = ctx.msg.mentionedJid[0]
    if (!mentioned)
      return sock.sendMessage(groupId, { text: 'Marque o usuario para banir.' })

    await sock.groupParticipantsUpdate(groupId, [mentioned], 'remove')

    return sock.sendMessage(groupId, {
      text: `${mention(mentioned)} foi removido do grupo.`,
      mentions: [mentioned]
    })
  }

  // ============================================================
  // ADD
  // ============================================================
  if (cmd === 'add') {
    if (!isBotAdmin)
      return sock.sendMessage(groupId, { text: 'Preciso ser admin para adicionar membros.' })

    const number = extractNumber(args[0])
    if (!number)
      return sock.sendMessage(groupId, { text: 'Informe o numero. Ex: #add 5511999999999' })

    const jid = number + '@s.whatsapp.net'
    await sock.groupParticipantsUpdate(groupId, [jid], 'add')

    return sock.sendMessage(groupId, { text: 'Tentando adicionar...' })
  }

  // ============================================================
  // PROMOVER
  // ============================================================
  if (cmd === 'promover') {
    if (!isBotAdmin)
      return sock.sendMessage(groupId, { text: 'Preciso ser admin para promover.' })

    const mentioned = ctx.msg.mentionedJid[0]
    if (!mentioned)
      return sock.sendMessage(groupId, { text: 'Marque o usuario.' })

    await sock.groupParticipantsUpdate(groupId, [mentioned], 'promote')

    return sock.sendMessage(groupId, {
      text: `${mention(mentioned)} promovido a administrador.`,
      mentions: [mentioned]
    })
  }

  // ============================================================
  // REBAIXAR
  // ============================================================
  if (cmd === 'rebaixar') {
    if (!isBotAdmin)
      return sock.sendMessage(groupId, { text: 'Preciso ser admin para rebaixar.' })

    const mentioned = ctx.msg.mentionedJid[0]
    if (!mentioned)
      return sock.sendMessage(groupId, { text: 'Marque o usuario.' })

    await sock.groupParticipantsUpdate(groupId, [mentioned], 'demote')

    return sock.sendMessage(groupId, {
      text: `${mention(mentioned)} rebaixado.`,
      mentions: [mentioned]
    })
  }

  // ============================================================
  // ADVERTIR
  // ============================================================
  if (['advertir', 'adverter'].includes(cmd)) {
    const mentioned = ctx.msg.mentionedJid[0]
    if (!mentioned)
      return sock.sendMessage(groupId, { text: 'Marque o usuario.' })

    const warns = db.addWarning(groupId, mentioned, 'Advertencia manual')

    return sock.sendMessage(groupId, {
      text: `${mention(mentioned)} recebeu advertencia.\nTotal: ${warns}/${grpSettings.maxWarnings}`,
      mentions: [mentioned]
    })
  }

  // ============================================================
  // LIMPAR AVISOS
  // ============================================================
  if (['clearwarnings', 'limparavisos'].includes(cmd)) {
    const mentioned = ctx.msg.mentionedJid[0]
    if (!mentioned)
      return sock.sendMessage(groupId, { text: 'Marque o usuario.' })

    db.clearWarnings(groupId, mentioned)

    return sock.sendMessage(groupId, {
      text: `Advertencias de ${mention(mentioned)} foram removidas.`,
      mentions: [mentioned]
    })
  }

  // ============================================================
  // TAGALL
  // ============================================================
  if (['tagall', 'marcar'].includes(cmd)) {
    const members = groupMeta.participants.map(p => p.id)

    let text = `${botHeader('MARCAÇÃO GERAL')}\n\n`
    for (let m of members) text += `• ${mention(m)}\n`
    text += botFooter()

    return sock.sendMessage(groupId, {
      text,
      mentions: members
    })
  }

  // ============================================================
  // LINK DO GRUPO
  // ============================================================
  if (cmd === 'linkgp') {
    if (!isBotAdmin)
      return sock.sendMessage(groupId, { text: 'Preciso ser admin.' })

    const code = await sock.groupInviteCode(groupId)

    return sock.sendMessage(groupId, {
      text: `Link do grupo:\nhttps://chat.whatsapp.com/${code}`
    })
  }

  // ============================================================
  // ABRIR / FECHAR GRUPO
  // ============================================================
  if (['fechargp', 'closegp'].includes(cmd)) {
    if (!isBotAdmin)
      return sock.sendMessage(groupId, { text: 'Preciso ser admin.' })

    await sock.groupSettingUpdate(groupId, 'announcement')

    return sock.sendMessage(groupId, { text: 'Grupo fechado. Apenas admins podem enviar mensagens.' })
  }

  if (['abrirgp', 'opengp'].includes(cmd)) {
    if (!isBotAdmin)
      return sock.sendMessage(groupId, { text: 'Preciso ser admin.' })

    await sock.groupSettingUpdate(groupId, 'not_announcement')

    return sock.sendMessage(groupId, { text: 'Grupo aberto para todos.' })
  }

  // ============================================================
  // TOGGLES DE CONFIG
  // ============================================================

  if (cmd === 'soadm') {
    const newValue = !grpSettings.soadm
    db.updateGroup(groupId, { soadm: newValue })

    return sock.sendMessage(groupId, {
      text: `Modo somente admin: ${newValue ? 'ATIVADO' : 'DESATIVADO'}`
    })
  }

  if (cmd === 'antilink') {
    const newValue = !grpSettings.antilink
    db.updateGroup(groupId, { antilink: newValue })

    return sock.sendMessage(groupId, {
      text: `Anti-link: ${newValue ? 'ATIVADO' : 'DESATIVADO'}`
    })
  }

  if (cmd === 'antiflood') {
    const newValue = !grpSettings.antiflood
    db.updateGroup(groupId, { antiflood: newValue })

    return sock.sendMessage(groupId, {
      text: `Anti-flood: ${newValue ? 'ATIVADO' : 'DESATIVADO'}`
    })
  }

}

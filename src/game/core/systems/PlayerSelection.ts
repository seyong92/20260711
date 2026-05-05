export type PlayerCharacterId = 'bride' | 'dragon'

let selectedPlayerCharacter: PlayerCharacterId = 'bride'

export function getSelectedPlayerCharacter() {
  return selectedPlayerCharacter
}

export function setSelectedPlayerCharacter(character: PlayerCharacterId) {
  selectedPlayerCharacter = character
}

export function resetSelectedPlayerCharacter() {
  selectedPlayerCharacter = 'bride'
}

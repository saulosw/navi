export type Category = 'Text' | 'Play' | 'Lounge';

export interface Channel {
  id: string;
  name: string;
  category: Category;
}

export interface Message {
  id: string;
  authorId: string;
  text: string;
  createdAt: string;
}

export function channelName(input: string, existing: Channel[]) {
  const name = input.trim().toLowerCase();
  if (!/^[a-z0-9-]{1,32}$/.test(name)) throw new Error('Use 1–32 letters, numbers or hyphens.');
  if (existing.some((channel) => channel.name === name))
    throw new Error('A channel with this name already exists.');
  return name;
}

export function validMessage(text: string) {
  return text.trim().length > 0 && text.length <= 2000;
}

import { Console, error } from 'console'
import express from 'express'
import { Request, Response } from 'express'
import { normalize } from 'path'
import { Note } from './note'
import { Tag } from './tag'
import fs from 'fs';
import json from 'stream/consumers'
import jwt from 'jsonwebtoken';
import { User } from './user'


const app = express()
const storeFile = "Storage.json"
let notes: Note[] = [];
let tags: Tag[] = [];
let users: User[] = [];
readStorage();
const user1 = new User("1234", "1234")
users.push(user1);
//console.log(FindUserByToken("eyJhbGciOiJIUzI1NiJ9.MTIzNDEyMzQ.WBpuhjb14tWIlpvRL2tMHJthjQo_hA_XUweh7SLIoVE"))
// const tag1 = new Tag("tag test1")
// const tag2 = new Tag("tag test3")
// const tag3 = new Tag("tag test24")
// tags.push(tag1, tag2, tag3)
// notes.push(
//   new Note(
//     {
//       title: "test",
//       content: "test",
//       createDate: "test",
//       tags: [tag1, tag2, tag3],
//       id: 1
//     }))
app.use(express.json())

app.post('/login', function (req: Request, res: Response) {
  if (req.body.login && req.body.password) {
    const tmp = new User(req.body.login, req.body.password)
    const user = FindUserByToken(tmp.token)
    if (user) {
      res.status(200).send(user.token)
    }
    else
      CreateUser(req.body.login, req.body.password)
  }
  else
    res.status(401).send("podaj login i hasło")
})

app.get('/note/:id', function (req: Request, res: Response) {
  // if (!CheckToken(req.headers.authorization))
  // return res.status(401).send("wymagane logowanie")
  const note = FindById(+req.params.id)
  note ?? res.send(404)
  res.status(200).send(note)
})
app.get('/note', function (req: Request, res: Response) {
  // if (!CheckToken(req.headers.authorization))
  // return res.status(401).send("wymagane logowanie")
  res.status(200).send(notes)
})

app.get('/tag/:id', function (req: Request, res: Response) {
  // if (!CheckToken(req.headers.authorization))
  // return res.status(401).send("wymagane logowanie")
  const tag = FindTagById(+req.params.id)
  tag ?? res.send(404)
  res.status(200).send(tag)
})
app.get('/tag', function (req: Request, res: Response) {
  // if (!CheckToken(req.headers.authorization))
  // return res.status(401).send("wymagane logowanie")
  res.status(200).send(tags)
})

app.post('/note', function (req: Request, res: Response) {
  if (!req.headers.authorization)
    return res.status(401).send("wymagane logowanie")
  const user = FindUserByHeader(req.headers.authorization)
  if (!user)
    return res.status(401).send("błedne dane")
  const tagsTmp: Tag[] = [];
  req.body.tags.forEach((element: Tag) => {
    tagsTmp.push(FindTagByName(element.name))

  })
  if (req.body.title && req.body.content) {
    const date = new Date()
    const note: Note = new Note(
      {
        title: req.body.title,
        content: req.body.title,
        createDate: date.toISOString(),
        tags: tagsTmp,
        id: Date.now(),
        user: user
      })
    notes.push(note)
    updateStorage();
    res.status(200).send(note)
  }
  else {
    res.status(400).send("Notatka musi zawierać tytuł i zawartość")
  }
})

app.post('/tag',
  function (req: Request, res: Response) {
    // if (!CheckToken(req.headers.authorization))
    // return res.status(401).send("wymagane logowanie")
    if (req.body.name) {
      const tag = CreateTag(req.body.name)
      updateStorage()
      res.status(200).send(tag)
    }
    else
      res.status(400).send("Tag musi mieć nazwę")
  })

app.put('/note/:id',
  function (req: Request, res: Response) {
    if (!req.headers.authorization)
      return res.status(401).send("wymagane logowanie")
    const user = FindUserByHeader(req.headers.authorization)
    if (!user)
      return res.status(401).send("błedne dane")
    const note = FindById(+req.params.id)
    if (note && note.user.token === user.token) {
      const editedNote: Note = new Note({
        title: req.body.title ?? note.title,
        content: req.body.content ?? note.content,
        createDate: note.createDate,
        tags: req.body.tags ?? note.tags,
        id: note.id,
        user: note.user
      })
      notes.splice(FindIndexById(+req.params.id), 1, editedNote)
      updateStorage();
      res.status(200).send("OK")
    }
    else
      res.status(404).send("Nie znaleziono")
  })

app.put('/tag/:id',
  function (req: Request, res: Response) {
    // if (!CheckToken(req.headers.authorization))
    // return res.status(401).send("wymagane logowanie")
    const tag = FindTagById(+req.params.id)
    if (tag) {
      tag.name = req.body.name
      tags.splice(FindTagIndexById(+req.params.id), 1, tag)
      res.status(200).send(tag)
    }
    else
      res.status(400).send("Nie znaleziono")
  })

app.delete('/note/:id',
  function (req: Request, res: Response) {
    // if (!CheckToken(req.headers.authorization))
    return res.status(401).send("wymagane logowanie")
    if (FindById(+req.params.id)) {
      notes.splice(FindIndexById(+req.params.id), 1)
      res.status(200).send("Usunięto")
    }
    else
      res.status(400).send("Nie znaleziono")
  }
)

app.delete('/tag/:id',
  function (req: Request, res: Response) {
    // if (!CheckToken(req.headers.authorization))
    return res.status(401).send("wymagane logowanie")
    if (FindTagById(+req.params.id)) {
      tags.splice(FindTagIndexById(+req.params.id), 1)
      res.status(200).send("Usunięto")
    }
    else
      res.status(400).send("Nie znaleziono")
  })


function FindById(id: number) {

  const note = notes.find(function (note: Note): boolean {
    if (note.id === id) {
      return true
    }
    else {
      return false
    }
  })
  return note
}
function FindIndexById(id: number): number {
  const noteIndex = notes.findIndex(function (note: Note): boolean {
    if (note.id === id) {
      return true
    }
    else {
      return false
    }
  })
  return noteIndex;
}
function FindTagByName(name: string): Tag {
  const tag = tags.find(function (tag: Tag) {
    if (tag.name.toLocaleLowerCase() === name.toLocaleLowerCase()) {
      return true
    }
    else {
      return false
    }
  })
  if (tag)
    return tag;
  else {
    return CreateTag(name)
  }
}
function FindTagById(id: number) {
  const tag = tags.find(function (tag: Tag) {
    if (tag.id === id) {
      return true
    }
    else {
      return false
    }
  })
  return tag;
}
function FindTagIndexById(id: number): number {
  const tagIndex = tags.findIndex(function (tag: Tag) {
    if (tag.id === id) {
      return true
    }
    else {
      return false
    }
  })
  return tagIndex;
}

function FindUserByToken(token: string) {
  const user = users.find(function (user: User) {
    if (user.token === token) {
      return true
    }
    else {
      return false
    }
  })
  return user;
}
function FindUserByHeader(header: string) {
  const tmp = header.split(" ", 2)
  if (tmp[0] === "Bearer")
    return FindUserByToken(tmp[1])
}
// function IsTagExists(name: string): void {
//   const tag = FindTagByName(name)
//   if (!tag) {
//     tags.push(new Tag(name))
//   }
// }
function CreateTag(name: string): Tag {
  const tag = new Tag(name)
  tags.push(tag)
  return tag;
}

function CreateUser(login: string, password: string) {
  const tmp = new User(login, password)
  if (!FindUserByToken(tmp.token)) {
    users.push(tmp)
    updateStorage()
  }
}
async function updateStorage(): Promise<void> {
  const tmp = { notes, tags, users: users }
  try {
    await fs.promises.writeFile(storeFile, JSON.stringify(tmp));
  } catch (err) {
    console.log(err)
  }
}
async function readStorage(): Promise<void> {
  try {
    const data = await fs.promises.readFile(storeFile, 'utf-8');
    notes = JSON.parse(data).notes
    tags = JSON.parse(data).tags
    users = JSON.parse(data).users
  } catch (err) {
    console.log(err)
  }
}
// function CheckToken(token: any): boolean {
//   if (token) {

//     if (tmp[1] === "")//"eyJhbGciOiJIUzI1NiJ9.cGF5bG9hZA.4GMt2k_zZryxhKgC8_HvdSZtYxyEyDa0AFIL-n60a8M")
//       return true
//     else
//       return false
//   }
//   else
//     return false
// }
app.listen(3000)


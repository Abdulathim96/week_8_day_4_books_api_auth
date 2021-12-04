const express = require("express")
const router = express.Router()
const mongoose = require("mongoose")
const { Book, bookJoi } = require("../models/Book")
const checkToken = require("../middleware/checkToken")

router.get("/", async (req, res) => {
  const books = await Book.find().select("-__v").limit(50).sort("-dataCreated").populate({
    path: "author",
    select: "-__v -password",
  })
  res.json(books)
})

router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json("book id shold be a valid opject id")
    }

    const book = await Book.findById(id) //.select("-title")
    if (!book) {
      return res.status(404).json("book not found")
    }

    res.json(book)
  } catch (error) {
    return res.status(500).json(error.massage)
  }
})
router.post("/", checkToken, async (req, res) => {
  try {
    const bookBody = req.body
    const { title, description, image } = bookBody
    const result = bookJoi.validate(bookBody)

    if (result.error) return res.status(400).json(result.error.details[0].message)

    const book = new Book({
      title,
      description,
      image,
      author: req.userId,
    })

    await book.save()
    req.json(book)
  } catch (error) {
    return res.status(500).json(error.message)
  }
})
router.put("/:id", checkToken, async (req, res) => {
  const id = req.params.id
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json("book id be a valid opject id")
  const { title, description, price } = req.body

  try {
    let book = await Book.findById(id)
    if (!book) return res.status(404).json("book not found")

    if (book.author != req.userId) return res.status(403).send("unauthorized action")

    book = await Book.findByIdAndUpdate(id, { $set: { title, description, image } }, { new: true })

    res.json(book)
  } catch (error) {
    return res.status(500).json(error.message)
  }
})

router.delete("/:id", checkToken, async (req, res) => {
  try {
    const id = req.params.id
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json("book id should be a valid opject")

    const book = await Book.findById(id)
    if (!book) return res.status(404).json("book not found")

    if (book.author != req.userId) return res.status(403).send("unauthorized action")

    await Book.findByIdAndRemove(id)
    res.json("book removed")
  } catch (error) {
    return res.status(500).json(error.massage)
  }
})

module.exports = router
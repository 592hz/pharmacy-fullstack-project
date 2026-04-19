import { Router } from 'express';
import { getNotes, createNote, deleteNote, updateNote } from '../controllers/note.controller.js';

const router = Router();

router.get('/', getNotes);
router.post('/', createNote);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);

export default router;

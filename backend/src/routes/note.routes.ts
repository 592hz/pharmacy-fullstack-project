import { Router } from 'express';
import { getNotes, createNote, deleteNote } from '../controllers/note.controller.js';

const router = Router();

router.get('/', getNotes);
router.post('/', createNote);
router.delete('/:id', deleteNote);

export default router;

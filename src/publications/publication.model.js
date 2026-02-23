import mongoose from 'mongoose';

const { Schema } = mongoose;

const publicationSchema = new Schema(
    {
        title: {
            type: String,
            required: [true, 'El título es obligatorio'],
            trim: true,
            minlength: [3, 'El título debe tener al menos 3 caracteres'],
            maxlength: [100, 'El título no puede tener más de 100 caracteres'],
        },
        category: {
            type: String,
            required: [true, 'La categoría es obligatoria'],
            enum: {
                values: ['Opinión', 'Tecnología', 'Deportes', 'Política', 'Entretenimiento', 'Educación', 'Salud', 'Otro'],
                message: 'La categoría {VALUE} no es válida',
            },
        },
        content: {
            type: String,
            required: [true, 'El contenido es obligatorio'],
            trim: true,
            minlength: [10, 'El contenido debe tener al menos 10 caracteres'],
            maxlength: [2000, 'El contenido no puede tener más de 2000 caracteres'],
        },
        author: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        status: {
            type: String,
            enum: ['active', 'deleted'],
            default: 'active',
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Índices para búsqueda y filtrado
publicationSchema.index({ author: 1 });
publicationSchema.index({ category: 1 });
publicationSchema.index({ createdAt: -1 });
publicationSchema.index({ status: 1 });

export const Publication = mongoose.model('Publication', publicationSchema);

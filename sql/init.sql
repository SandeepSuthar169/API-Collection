
--  Todo Table
CREATE TABLE todos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    "isComplete" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
)

-- Avatar Table
CREATE TABLE avatars (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    image TEXT NOT NULL,
    image_name VARCHAR(255) NOT NULL,
    categories VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_avatar_category CHECK (
        categories IN (
            'Clay',
            'Criters',
            'Planets',
            'Sprouts',
            'Thumbs'
        )
    )
)
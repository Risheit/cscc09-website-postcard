import { User } from '@/backend/users';
import { faCheck, faPen, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { KeyboardEvent, useEffect, useState } from 'react';

export default function DisplayName(props: {
  user?: User;
  onEdit?: (formData: { displayName: string }) => void;
}) {
  const { user, onEdit } = props;
  const isEditable = !!onEdit;

  const [displayNameContent, setDisplayNameContent] = useState(
    user?.displayName
  );
  const [isDisplayNameHovered, setIsDisplayNameHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.displayName);

  function handleKeyDown(ev: KeyboardEvent<HTMLInputElement>): void {
    if (!editName || editName.trim() === '') {
      return;
    }

    if (ev.key === 'Enter') {
      setIsEditing(false);
      if (onEdit) {
        onEdit({ displayName: editName });
        setDisplayNameContent(editName);
      }
    }
  }

  useEffect(() => {
    setDisplayNameContent(user?.displayName);
    if (!isEditing) {
      setEditName(user?.displayName);
    }
  }, [user?.displayName, isEditing]);

  return (
    <div>
      {!isEditing && (
        <div
          className="flex h-fit items-center transition-all p-2"
          onMouseEnter={() => setIsDisplayNameHovered(true)}
          onMouseLeave={() => setIsDisplayNameHovered(false)}
          onClick={isEditable ? () => setIsEditing(true) : undefined}
        >
          <h1 className="text-4xl">{displayNameContent}</h1>
          {isDisplayNameHovered && isEditable && (
            <FontAwesomeIcon
              icon={faPen}
              className="h-4 self-center px-4 opacity-50"
            />
          )}
        </div>
      )}
      {isEditing && (
        <span className="flex items-center gap-4">
          <input
            type="text"
            className="text-4xl p-2 bg-background-50 rounded w-full max-w-[500px]"
            defaultValue={editName}
            name="username"
            onKeyDown={handleKeyDown}
            onChange={(ev) => setEditName(ev.target.value)}
            autoFocus
            required
            maxLength={20}
          />

          <FontAwesomeIcon
            icon={faCheck}
            className="h-7 opacity-50 hover:opacity-100"
            onClick={() => {
              if (!editName || editName.trim() === '') {
                return;
              }

              setIsEditing(false);
              if (onEdit) {
                onEdit({ displayName: editName });
                setDisplayNameContent(editName);
              }
            }}
          />

          <FontAwesomeIcon
            icon={faXmark}
            className="h-7 opacity-50 hover:opacity-100"
            onClick={() => setIsEditing(false)}
          />
        </span>
      )}
    </div>
  );
}

import os
import shutil

src_dir = 'static/covers'
dst_dir = 'static/images/covers'

# Assicurati che la directory di destinazione esista
os.makedirs(dst_dir, exist_ok=True)

# Sposta tutti i file dalla vecchia alla nuova directory
for filename in os.listdir(src_dir):
    src_file = os.path.join(src_dir, filename)
    dst_file = os.path.join(dst_dir, filename)
    shutil.move(src_file, dst_file)

print("File spostati con successo!")

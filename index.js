import { readdir, lstat } from 'node:fs/promises'
import { userInfo } from 'node:os'
import { join } from 'node:path'
import { argv, exit } from 'node:process'
import pc from 'picocolors'

const folder = argv[2] ?? '.'

async function ls(folder)
{
    let files

    try {
        files = await readdir(folder)   
    } catch {
        console.error(`No se pudo leer el directorio ${folder}!`)
        exit(1)
    }

    const filesPromises = files.map(async file => 
        {
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
            const filePath = join(folder, file)
            let fileStats

            try {
                fileStats = await lstat(filePath)
            } catch {
                console.error(`No se puede leer el archivo ${filePath}!`)
                exit(1)
            }
            
            const type = pc.blue(fileStats.isSymbolicLink() ? 'l' : fileStats.isDirectory() ? 'd' : '-')
            const fileName = pc.white(file.padEnd(20));
            const permissions = unixPermissions(fileStats.mode)
            const links  = pc.blue(fileStats.nlink.toString().padEnd(3));
            const size = pc.yellow(fileStats.size.toString().padStart(15))
            const date = new Date(fileStats.mtime)
            const hour = date.getHours().toString().padStart(2,'0')
            const minutes = date.getMinutes().toString().padStart(2,'0')
            const day = date.getDate().toString().padStart(2,'0')
            const strDate = pc.green(`${months[date.getMonth()]} ${day} ${hour}:${minutes}`)

            return `${type}${permissions} ${links} ${userInfo().username} ${size} ${strDate} ${fileName}`
        })
    
    const filesInfo = await Promise.all(filesPromises)
    
    console.log(pc.magenta(`total ${files.length}`))
    filesInfo.forEach(fileInfo => console.log(fileInfo))
}

function unixPermissions(mode) 
{
    const octal = parseInt((mode & parseInt('777', 8)).toString(8))

    // Convierte el número octal a una cadena binaria de 9 bits
    const binaryString = octal.toString(2).padStart(9, '0')
  
    // Extrae los conjuntos de tres bits para cada tipo de permiso
    const ownerPermissions = binaryString.slice(0, 3)
    const groupPermissions = binaryString.slice(3, 6)
    const otherPermissions = binaryString.slice(6)
  
    // Función para convertir un conjunto de tres bits a la notación de permisos rwx
    function convertToPermissions(bits) {
      let permissions = ''
      permissions += bits[0] === '1' ? 'r' : '-'
      permissions += bits[1] === '1' ? 'w' : '-'
      permissions += bits[2] === '1' ? 'x' : '-'
      return permissions
    }
  
    // Concatena los resultados para obtener el resultado final
    const unixPermissions = pc.red(convertToPermissions(ownerPermissions)) +
                            pc.green(convertToPermissions(groupPermissions)) +
                            pc.yellow( convertToPermissions(otherPermissions))
  
    return unixPermissions
}

ls(folder)

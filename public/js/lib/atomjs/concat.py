def readFile(path):
    f = open(path, 'r')
    txt = f.read()
    f.close()
    return txt

src = readFile('lang.js') + '\n'
src += readFile('log.js') + '\n'
src += readFile('url.js') + '\n'
src += readFile('dom.js') + '\n'
src += readFile('atom.js') + '\n'
src += readFile('control.js') + '\n'
src += readFile('loader.js') + '\n'

f = open('../atom-concat.js', 'w')
f.write(src)
f.close()
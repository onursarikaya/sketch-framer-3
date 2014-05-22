# A sample Guardfile
# More info at https://github.com/guard/guard#readme

guard 'shell' do
  watch(%r{src/.*}) {
    system("rake install")
    system("say installation complete")
  }
end

guard :shell do
  watch(%r{samples/(.*)\.(png)}) {
    system("say export complete")
  }
end

# guard :shell do
#   watch(/.*/) { `git status` }
# end
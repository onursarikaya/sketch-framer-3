# A sample Guardfile
# More info at https://github.com/guard/guard#readme

guard 'shell' do
  watch(%r{src/.+js}) {
    system("rake")
    system("say installation complete")
    # system("rake run")
  }
end

# guard :shell do
#   watch(%r{samples/(.*)\.(png)}) {
#     system("say export complete")
#   }
# end

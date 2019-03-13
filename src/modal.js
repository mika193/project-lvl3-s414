export default (name, text, id) => {
  const modal = document.createElement('div');
  modal.classList.add('modal');
  modal.tabIndex = '-1';
  modal.role = 'dialog';
  modal.id = id;

  const content = `<div class="modal-dialog" role="document"><div class="modal-content"> <div class="modal-header"><h5 class="modal-title">${name}</h5><button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button></div><div class="modal-body"><p>${text}</p></div></div>`;

  modal.innerHTML = content;
  return modal;
};

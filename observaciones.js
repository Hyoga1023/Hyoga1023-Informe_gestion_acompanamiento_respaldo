        function toggleObservacion(checkboxId, textareaId) {
            const checkbox = document.getElementById(checkboxId);
            const textarea = document.getElementById(textareaId);
            
            if (checkbox.checked) {
                textarea.style.display = 'block';
            } else {
                textarea.style.display = 'none';
                textarea.value = '';
            }
        }

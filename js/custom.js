document.addEventListener('DOMContentLoaded', function() {
    // Handle Bootstrap-like navbar toggling
    var toggles = document.querySelectorAll('[data-toggle="collapse"]');
    toggles.forEach(function(toggle) {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            var targetSelector = toggle.getAttribute('data-target');
            if (targetSelector) {
                var target = document.querySelector(targetSelector);
                if (target) {
                    target.classList.toggle('in');
                }
            }
        });
    });
});

const countrySel = document.getElementById('country');
const genderSel = document.getElementById('gender');

function selectSpecific(elem, value) {
    for(let i = 0; i < elem.options.length; i++) {
        if(elem.options[i].value.toString().trim() === value.toString().trim()) {
            elem.selectedIndex = i;
        };
    };
};

selectSpecific(countrySel, currentCountry);
selectSpecific(genderSel, currentGender);
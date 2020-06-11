const countrySel = document.getElementById('country');
const genderSel = document.getElementById('gender');

function selectSpecific(elem, value) {
    for(let i = 0; i < elem.options.length; i++) {
        if(elem.options[i].value === value) {
            elem.selectedIndex = i;
        };
    };
};

selectSpecific(countrySel, "<%=typeof formData !== 'undefined' ? formData.country : user.location%>");
selectSpecific(genderSel, "<%=typeof formData !== 'undefined' ? formData.gender : user.gender%>");
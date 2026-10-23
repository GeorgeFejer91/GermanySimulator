export function addPanoramaCeiling(layout,{box}){
  const floor=13.25,ceiling=17.95;
  layout.panoramaServices={sources:['A13','I11','I19'],photoViews:[15,16],floorHeight:floor,ceilingHeight:ceiling,
    confidence:'Photographed ceiling, acoustic clouds, radiators and conduit; dimensions, counts and positions estimated',
    switchgearHistory:'ART04 wide installation identifies the switchgear-framed counter as Klo Bar; it is not established as an earlier Panorama counter. Contemporary retention remains unverified.'};
  box('Panorama fitted ceiling',[-13.25,ceiling+.09,-13.25],[16.5,.18,16.5],'pale','interior',true);
  for(const z of [-20.4,-15,-9.6])
    box('Panorama ceiling beam',[-13.25,ceiling-.17,z],[16.5,.34,.36],'pale','interior',true);
  for(let row=0;row<4;row++)for(let column=0;column<4;column++){
    const x=-19.8+column*3.3+(row%2)*.7,z=[-18.9,-16.5,-12.3,-7.3][row];
    box('Panorama acoustic cloud',[x,ceiling-.27-(column%2)*.06,z],[1.65,.24,2.05],'pale','interior',true);
  }
}

export function addPanoramaServiceFixtures(layout,{fixture,box,cylinder,rod}){
  const floor=layout.panoramaServices.floorHeight,ceiling=layout.panoramaServices.ceilingHeight;
  for(const [i,z]of [-19.25,-13.7,-8.15].entries())
    fixture('panorama-radiator-'+i,[-21.05,floor,z],['I19'],{width:1.95,depth:.18,height:.78},()=>{
      for(const y of [.19,.77])rod('header',[0,y,-.97],[0,y,.97],.065,'steel',true);
      for(let rib=0;rib<24;rib++)box('cast rib',[0,.48,-.897+rib*.078],[.16,.6,.045],'steel',true);
      for(const z of [-.78,.78]){
        rod('supply pipe',[-.03,.02,z],[-.03,.19,z],.032,'steel',true);
        rod('valve stem',[.13,.13,z],[.13,.21,z],.035,'aluminium',true);
        box('mounting foot',[0,.04,z],[.12,.08,.12],'steel',true);
      }
    });
  for(const [i,z]of [-16.5,-11].entries())
    fixture('panorama-service-tubes-'+i,[-20.9,floor,z],['I19'],{height:3.9,depth:.2},()=>{
      for(const z of [-.055,.055]){
        rod('vertical conduit',[0,.8,z],[0,4.1,z],.026,'aluminium',true);
        for(const y of [1.1,2.8,3.95])box('conduit clamp',[0,y,z],[.055,.035,.07],'steel',true);
      }
      cylinder('diffuser',[.085,2.85,0],.07,1.45,'opal');
      for(const y of [2.09,3.61])cylinder('diffuser end cap',[.085,y,0],.085,.06,'aluminium');
    });
  fixture('panorama-service-overhead',[-13.25,floor,-13.25],['I19'],{height:ceiling-floor},()=>{
    for(const z of [-6.5,5.8]){
      rod('exposed conduit',[-7,4.42,z],[7,4.42,z],.032,'steel');
      for(const x of [-6,-2,2,6]){
        box('junction box',[x,4.39,z],[.13,.08,.14],'steel');
        rod('ceiling fixing',[x,4.43,z],[x,ceiling-floor-.015,z],.018,'steel');
      }
    }
  });
}

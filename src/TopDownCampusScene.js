import Phaser from 'phaser';

// v2.9 — asset-authored top-down GLR level.
// The architecture is built from the approved generated pixel-art assets,
// rather than approximated with generic Phaser rectangles.

const GLR_GREEN = 0x78c841;
const WORLD_W = 4200;
const WORLD_H = 1180;
const WALL = 24;
const DOOR_W = 104;

const HALL = { x: 450, y: 500, w: 3200, h: 250 };
const ROOM_Y = 80;
const ROOM_W = 420;
const ROOM_H = 420;
const ROOM_X = 510;
const ROOM_NAMES = [
  'B5.400B',
  'B5.402A\nSECRETARIAAT',
  'DOCENTENRUIMTE',
  'B5.420',
  'B5.430',
  'B5.440',
  'B5.450',
];
const ROOMS = ROOM_NAMES.map((name,i)=>({name,x:ROOM_X+i*ROOM_W,y:ROOM_Y,w:ROOM_W,h:ROOM_H}));
const CLASS_BLOCK = {x:ROOM_X,y:ROOM_Y,w:ROOM_W*ROOMS.length,h:ROOM_H};

const END_400 = { name:'B5.400A', x:30, y:415, w:ROOM_W, h:ROOM_H, side:'right' };
const END_460 = { name:'B5.460', x:HALL.x+HALL.w, y:415, w:ROOM_W, h:ROOM_H, side:'left' };

const EXIT_Y = HALL.y + HALL.h;
const EXITS = [
  {name:'TRAP / LIFT', x:800, w:320, kind:'stairs'},
  {name:'TRAP / LIFT', x:1930, w:320, kind:'stairs'},
  {name:'TRAP / LIFT', x:3020, w:320, kind:'stairs'},
];
const TOILETS = [
  {name:'HERENTOILET', x:1440, w:230, kind:'toilet'},
  {name:'DAMESTOILET', x:2620, w:230, kind:'toilet'},
];
const SERVICE_RECESSES=[...EXITS,...TOILETS].sort((a,b)=>a.x-b.x);

function addTextLabel(scene,x,y,text,size=11){
  return scene.add.text(x,y,text,{
    fontFamily:'monospace',fontSize:`${size}px`,fontStyle:'bold',
    color:'#f4fff1',backgroundColor:'#173e25',padding:{x:8,y:5},
    stroke:'#0b1b10',strokeThickness:1
  }).setOrigin(.5).setDepth(2400);
}

function fillRect(g,x,y,w,h,color,alpha=1){g.fillStyle(color,alpha).fillRect(x,y,w,h);}

export function makeTopDownCampusScene({done,lockedRef,talkRef,signRef}){
  return class TopDownCampusScene extends Phaser.Scene{
    constructor(){
      super({key:'TopDownCampus'});
      this.nearId=null;
      this.nearSign=false;
      this.frameIndex=0;
      this.lastFrame=0;
      this.facing='south';
      this.animationMode=null;
    }

    preload(){
      const directions=['south','south-east','east','north-east','north','north-west','west','south-west'];
      for(const dir of directions){
        this.load.image(`player_${dir}_idle`,`/assets/player/${dir}_idle.png`);
        for(let f=0;f<6;f++)this.load.image(`player_${dir}_${f}`,`/assets/player/${dir}_walk_${f}.png`);
        for(let f=0;f<4;f++)this.load.image(`player_${dir}_run_${f}`,`/assets/player/${dir}_run_${f}.png`);
      }
      for(const teacher of [0,1,2,3]){
        for(const dir of ['south-west','south-east','north-west','north-east']){
          this.load.image(`teacher_${teacher}_${dir}`,`/assets/teachers/teacher${teacher}_${dir}.png`);
        }
      }
      for(const dir of ['south-west','south-east','north-west','north-east']){
        this.load.image(`kim_${dir}`,`/assets/teachers/kim_${dir}.png`);
      }
      const env=['room_shell','room_plain','stairs','elevator','toilet_door','wayfinding','glr_screen_small','student_desk','student_desk_back','teacher_desk','screen','whiteboard','clock','plant','cabinet','watercooler','bench'];
      for(const key of env)this.load.image(`env_${key}`,`/assets/environment/${key}.png`);
    }

    create(){
      this.cameras.main.setBackgroundColor('#303a43');
      this.physics.world.setBounds(0,0,WORLD_W,WORLD_H);

      // Background and corridor use the same warm tiled palette as the approved concept.
      const bg=this.add.graphics().setDepth(-1000);
      fillRect(bg,0,0,WORLD_W,WORLD_H,0x303a43);
      this.drawCorridor(bg);
      this.drawTopStructure(bg);
      this.drawServiceFloor(bg);

      // Environment sprites are deliberately nearest-filtered to keep the authored pixel look.
      this.createArchitecture();
      this.createClassroomFurniture();
      this.createCorridorProps();
      this.createServiceAreas();

      for(const key of this.textures.getTextureKeys()){
        if(key.startsWith('env_'))this.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
        if(key.startsWith('player_')||key.startsWith('teacher_')||key.startsWith('kim_'))this.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
      }

      this.walls=this.physics.add.staticGroup();
      this.buildCollisions();

      const start={x:880,y:HALL.y+HALL.h/2};
      this.player=this.physics.add.sprite(start.x,start.y,'player_south_idle')
        .setScale(1.2).setOrigin(.5,64/68);
      this.player.body.setSize(15,9).setOffset(26.5,56);
      this.player.setCollideWorldBounds(true);
      this.physics.add.collider(this.player,this.walls);

      this.playerName=this.add.text(start.x,start.y+12,'JIJ',{
        fontFamily:'monospace',fontSize:'11px',fontStyle:'bold',color:'#fff',
        backgroundColor:'#18232c',padding:{x:7,y:4}
      }).setOrigin(.5,0).setDepth(4000);

      this.createActors(done);
      this.createWayfindingSign();

      this.prompt=this.add.text(0,0,'E  PRAAT',{
        fontFamily:'monospace',fontStyle:'bold',fontSize:'13px',color:'#14220e',
        backgroundColor:'#78c841',padding:{x:10,y:7},stroke:'#0a1207',strokeThickness:1
      }).setOrigin(.5).setDepth(5000).setVisible(false);

      this.keys=this.input.keyboard.addKeys({w:'W',a:'A',s:'S',d:'D',shift:'SHIFT'});
      this.arrows=this.input.keyboard.createCursorKeys();
      this.input.keyboard.on('keydown-E',event=>{
        const el=event?.target;
        const editing=el&&(el.tagName==='TEXTAREA'||el.tagName==='INPUT'||el.isContentEditable);
        if(editing||lockedRef.current)return;
        if(this.nearId)talkRef.current(this.nearId);
        else if(this.nearSign)signRef.current?.();
      });

      this.cameras.main.setBounds(0,0,WORLD_W,WORLD_H);
      this.cameras.main.startFollow(this.player,true,.08,.08);
      this.cameras.main.setDeadzone(420,245);
      this.cameras.main.setZoom(1.04);
      this.cameras.main.centerOn(start.x,start.y);
    }

    drawCorridor(g){
      // Warm square tiles exactly like the approved mock-up.
      fillRect(g,HALL.x,HALL.y,HALL.w,HALL.h,0xd7d2c7);
      fillRect(g,HALL.x,HALL.y,HALL.w,9,0xa9a59c);
      fillRect(g,HALL.x,HALL.y+HALL.h-9,HALL.w,9,0xa9a59c);
      for(let x=HALL.x;x<=HALL.x+HALL.w;x+=48){g.lineStyle(1,0xbab5ab,.50).lineBetween(x,HALL.y,x,HALL.y+HALL.h);}
      for(let y=HALL.y;y<=HALL.y+HALL.h;y+=48){g.lineStyle(1,0xbab5ab,.50).lineBetween(HALL.x,y,HALL.x+HALL.w,y);}
      // dark skirting gives the same visual separation as the reference
      fillRect(g,HALL.x,HALL.y-10,HALL.w,10,0x47515a);
      fillRect(g,HALL.x,HALL.y+HALL.h,HALL.w,10,0x47515a);
    }

    drawTopStructure(g){
      // dark industrial strip behind rooms
      fillRect(g,0,0,WORLD_W,78,0x2f3942);
      fillRect(g,0,78,WORLD_W,12,0x56616a);
      fillRect(g,0,90,WORLD_W,8,GLR_GREEN);
      for(let x=280;x<WORLD_W-250;x+=510){
        fillRect(g,x,48,16,70,0x626c74);
        fillRect(g,x+3,48,10,70,0x4a535b);
      }
    }

    drawServiceFloor(g){
      // Service areas are isolated rooms, not one continuous lower corridor.
      fillRect(g,HALL.x,EXIT_Y,HALL.w,300,0x303a43);
      for(const r of SERVICE_RECESSES){
        const depth=225;
        fillRect(g,r.x,EXIT_Y,r.w,depth,0x4b555d);
        fillRect(g,r.x+WALL,EXIT_Y+WALL,r.w-WALL*2,depth-WALL*2,0xd7d2c7);
        for(let xx=r.x+WALL;xx<r.x+r.w-WALL;xx+=48){
          g.lineStyle(1,0xbab5ab,.45).lineBetween(xx,EXIT_Y+WALL,xx,EXIT_Y+depth-WALL);
        }
        for(let yy=EXIT_Y+WALL;yy<EXIT_Y+depth-WALL;yy+=48){
          g.lineStyle(1,0xbab5ab,.45).lineBetween(r.x+WALL,yy,r.x+r.w-WALL,yy);
        }
        if(r.kind==='stairs'){
          // The stair and lift are two physically separate compartments.
          const dividerX=r.x+r.w*0.60;
          fillRect(g,dividerX-WALL/2,EXIT_Y,WALL,depth,0x59636b);
          fillRect(g,r.x+WALL,EXIT_Y+WALL,r.w*0.60-WALL*1.5,12,GLR_GREEN);
          fillRect(g,dividerX+WALL/2,EXIT_Y+WALL,r.x+r.w-WALL-(dividerX+WALL/2),12,GLR_GREEN);
        }else{
          fillRect(g,r.x+WALL,EXIT_Y+WALL,r.w-WALL*2,12,GLR_GREEN);
        }
      }
    }

    createArchitecture(){
      this.roomSprites=[];
      this.roomLabels=[];
      for(const room of ROOMS){
        const shell=this.add.image(room.x,room.y,'env_room_shell')
          .setOrigin(0,0).setDisplaySize(room.w,room.h).setDepth(200);
        this.roomSprites.push(shell);
        const gapX=room.x+room.w/2-DOOR_W/2;
        const label=addTextLabel(this,gapX-16,room.y+room.h-24,room.name,11).setOrigin(1,.5).setDepth(2100);
        this.roomLabels.push(label);
      }

      const left=this.add.image(END_400.x+END_400.w/2,END_400.y+END_400.h/2,'env_room_shell')
        .setDisplaySize(END_400.w,END_400.h).setAngle(-90).setDepth(190);
      const right=this.add.image(END_460.x+END_460.w/2,END_460.y+END_460.h/2,'env_room_shell')
        .setDisplaySize(END_460.w,END_460.h).setAngle(90).setDepth(190);
      this.roomSprites.push(left,right);
      const sideLabelY=HALL.y+HALL.h/2;
      this.roomLabels.push(addTextLabel(this,END_400.x+END_400.w-34,sideLabelY,END_400.name,11).setOrigin(1,.5).setDepth(2100));
      this.roomLabels.push(addTextLabel(this,END_460.x+92,sideLabelY,END_460.name,11).setOrigin(1,.5).setDepth(2100));
    }

    studentDeskPositions(room){
      const xs=[room.x+70,room.x+155,room.x+265,room.x+350];
      const ys=[room.y+252,room.y+310];
      return ys.flatMap(y=>xs.map(x=>({x,y})));
    }

    createClassroomFurniture(){
      this.furniture=[];
      ROOMS.forEach((room,index)=>{
        // Secretariaat and Docentenruimte stay intentionally empty for now.
        if(room.name.includes('SECRETARIAAT')||room.name.includes('DOCENTENRUIMTE')) return;

        // Teacher zone: screen on wall, desk slightly farther north, plant tucked higher/left.
        const screen=this.add.image(room.x+room.w/2,room.y+82,'env_screen')
          .setOrigin(.5).setScale(.28).setDepth(500);
        const teacherDesk=this.add.image(room.x+room.w/2,room.y+210,'env_teacher_desk')
          .setOrigin(.5,1).setScale(.27).setDepth(room.y+220);
        const plant=this.add.image(room.x+room.w-54,room.y+194,'env_plant')
          .setOrigin(.5,1).setScale(.18).setDepth(room.y+204);
        this.furniture.push(screen,teacherDesk,plant);

        for(const p of this.studentDeskPositions(room)){
          const desk=this.add.image(p.x,p.y,'env_student_desk')
            .setOrigin(.5,1).setScale(.205).setDepth(p.y+6);
          this.furniture.push(desk);
        }
      });
    }

    createCorridorProps(){
      this.props=[];
    }

    createServiceAreas(){
      this.serviceSprites=[];
      for(const r of SERVICE_RECESSES){
        if(r.kind==='stairs'){
          const dividerX=r.x+r.w*0.60;
          const stairCenter=(r.x+WALL + dividerX-WALL/2)/2;
          const liftCenter=(dividerX+WALL/2 + r.x+r.w-WALL)/2;
          const stairs=this.add.image(stairCenter,EXIT_Y+188,'env_stairs')
            .setOrigin(.5,1).setScale(.40).setDepth(EXIT_Y+196);
          const lift=this.add.image(liftCenter,EXIT_Y+190,'env_elevator')
            .setOrigin(.5,1).setScale(.32).setDepth(EXIT_Y+198);
          this.serviceSprites.push(stairs,lift);
          addTextLabel(this,stairCenter,EXIT_Y+26,'TRAPPENHUIS',9);
          addTextLabel(this,liftCenter,EXIT_Y+26,'LIFT',9);
        }else{
          const door=this.add.image(r.x+r.w/2,EXIT_Y+188,'env_toilet_door')
            .setOrigin(.5,1).setScale(.42).setDepth(EXIT_Y+195);
          this.serviceSprites.push(door);
          addTextLabel(this,r.x+r.w/2,EXIT_Y+26,r.name,10);
        }
      }
    }

    createWayfindingSign(){
      const x=700,y=HALL.y+HALL.h-22;
      this.signPoint={x,y:y-70};
      const sign=this.add.image(x,y,'env_wayfinding').setOrigin(.5,1).setScale(.47).setDepth(y+30);
      this.props.push(sign);
    }

    createActors(done){
      this.actors=[];
      const actorDefs=[
        {id:'kim',name:'MVR. SMIT',kind:'kim',x:END_400.x+END_400.w/2,y:END_400.y+END_400.h-105},
        {id:'sam',name:'MR. VAN DER HEIJDEN',teacher:0,x:1230,y:HALL.y+HALL.h-54},
        {id:'css',name:'MVR. HEINSDIJK',teacher:1,x:1990,y:HALL.y+HALL.h-54},
        {id:'game',name:'MVR. GOLDEWIJK',teacher:3,x:2730,y:HALL.y+HALL.h-54},
        {id:'final',name:'MR. BIJLSMA',teacher:2,x:3410,y:HALL.y+HALL.h-54,final:true},
      ];
      for(const a of actorDefs){
        const completed=done.includes(a.id);
        const enabled=!a.final||['sam','css','game','kim'].every(q=>done.includes(q));
        const actor=this.add.image(a.x,a.y,a.kind==='kim'?'kim_south-west':`teacher_${a.teacher}_south-west`)
          .setScale(.82).setOrigin(.5,64/68).setDepth(a.y+60);
        const nameTag=addTextLabel(this,a.x,a.y+18,a.name,10).setDepth(4200);
        const marker=this.add.text(a.x,a.y-58,completed?'✓':enabled?'!':'…',{
          fontFamily:'Arial Black',fontSize:'25px',color:'#fff',backgroundColor:'#78c841',
          padding:{x:7,y:2},stroke:'#183020',strokeThickness:3
        }).setOrigin(.5).setDepth(4201);
        if(!completed&&enabled)this.tweens.add({targets:marker,y:a.y-66,duration:650,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
        this.actors.push({...a,actor,nameTag,marker,enabled});
      }
    }

    addWallRect(x,y,w,h){
      if(w<=0||h<=0)return;
      const body=this.add.rectangle(x+w/2,y+h/2,w,h,0,0).setVisible(false);
      this.physics.add.existing(body,true);
      this.walls.add(body);
    }

    buildCollisions(){
      const SIDE_W=30;
      const TOP_BLOCK=124;
      const FRONT_H=90;

      for(const room of ROOMS){
        const gapX=room.x+room.w/2-DOOR_W/2;
        const frontY=room.y+room.h-FRONT_H;
        this.addWallRect(room.x,room.y,room.w,TOP_BLOCK);
        this.addWallRect(room.x,room.y+TOP_BLOCK,SIDE_W,frontY-(room.y+TOP_BLOCK));
        this.addWallRect(room.x+room.w-SIDE_W,room.y+TOP_BLOCK,SIDE_W,frontY-(room.y+TOP_BLOCK));
        this.addWallRect(room.x,frontY,gapX-room.x,FRONT_H);
        this.addWallRect(gapX+DOOR_W,frontY,room.x+room.w-(gapX+DOOR_W),FRONT_H);

        if(!room.name.includes('SECRETARIAAT')&&!room.name.includes('DOCENTENRUIMTE')){
          this.addWallRect(room.x+room.w/2-52,room.y+182,104,30);
          for(const pos of this.studentDeskPositions(room))this.addWallRect(pos.x-24,pos.y-23,48,25);
        }
      }

      this.addWallRect(HALL.x,HALL.y-10,ROOM_X-HALL.x,20);
      const classEnd=ROOM_X+ROOM_W*ROOMS.length;
      this.addWallRect(classEnd,HALL.y-10,HALL.x+HALL.w-classEnd,20);

      {
        const r=END_400,gapY=HALL.y+HALL.h/2-DOOR_W/2,rearW=TOP_BLOCK,frontW=FRONT_H;
        this.addWallRect(r.x,r.y,rearW,r.h);
        this.addWallRect(r.x+rearW,r.y,r.w-rearW-frontW,SIDE_W);
        this.addWallRect(r.x+rearW,r.y+r.h-SIDE_W,r.w-rearW-frontW,SIDE_W);
        const fx=r.x+r.w-frontW;
        this.addWallRect(fx,r.y,frontW,gapY-r.y);
        this.addWallRect(fx,gapY+DOOR_W,frontW,r.y+r.h-(gapY+DOOR_W));
      }
      {
        const r=END_460,gapY=HALL.y+HALL.h/2-DOOR_W/2,rearW=TOP_BLOCK,frontW=FRONT_H;
        this.addWallRect(r.x+r.w-rearW,r.y,rearW,r.h);
        this.addWallRect(r.x+frontW,r.y,r.w-rearW-frontW,SIDE_W);
        this.addWallRect(r.x+frontW,r.y+r.h-SIDE_W,r.w-rearW-frontW,SIDE_W);
        this.addWallRect(r.x,r.y,frontW,gapY-r.y);
        this.addWallRect(r.x,gapY+DOOR_W,frontW,r.y+r.h-(gapY+DOOR_W));
      }

      let cursor=HALL.x;
      for(const r of SERVICE_RECESSES){
        this.addWallRect(cursor,EXIT_Y-10,r.x-cursor,20);
        cursor=r.x+r.w;
      }
      this.addWallRect(cursor,EXIT_Y-10,HALL.x+HALL.w-cursor,20);

      for(const r of SERVICE_RECESSES){
        const depth=225;
        this.addWallRect(r.x,EXIT_Y,WALL,depth);
        this.addWallRect(r.x+r.w-WALL,EXIT_Y,WALL,depth);
        this.addWallRect(r.x,EXIT_Y+depth-WALL,r.w,WALL);
        if(r.kind==='stairs'){
          const dividerX=r.x+r.w*0.60;
          this.addWallRect(dividerX-WALL/2,EXIT_Y,WALL,depth);
          const stairDoorW=82,liftDoorW=64;
          const stairCenter=(r.x+WALL + dividerX-WALL/2)/2;
          const liftCenter=(dividerX+WALL/2 + r.x+r.w-WALL)/2;
          this.addWallRect(r.x,EXIT_Y-10,stairCenter-stairDoorW/2-r.x,20);
          this.addWallRect(stairCenter+stairDoorW/2,EXIT_Y-10,(dividerX-WALL/2)-(stairCenter+stairDoorW/2),20);
          this.addWallRect(dividerX+WALL/2,EXIT_Y-10,liftCenter-liftDoorW/2-(dividerX+WALL/2),20);
          this.addWallRect(liftCenter+liftDoorW/2,EXIT_Y-10,r.x+r.w-(liftCenter+liftDoorW/2),20);
        }
      }
    }

    update(t){
      if(!this.player)return;
      if(lockedRef.current){this.player.body.setVelocity(0);return;}
      const k=this.keys,a=this.arrows;
      let x=0,y=0;
      if(k.a.isDown||a.left.isDown)x-=1;
      if(k.d.isDown||a.right.isDown)x+=1;
      if(k.w.isDown||a.up.isDown)y-=1;
      if(k.s.isDown||a.down.isDown)y+=1;
      const moving=!!(x||y);
      if(x&&y){const inv=Math.SQRT1_2;x*=inv;y*=inv;}
      const sprinting=moving&&k.shift.isDown;
      const speed=sprinting?250:155;
      this.player.body.setVelocity(x*speed,y*speed);

      if(moving){
        if(Math.abs(x)<.001&&y<0)this.facing='north';
        else if(x>0&&y<0)this.facing='north-east';
        else if(x>0&&Math.abs(y)<.001)this.facing='east';
        else if(x>0&&y>0)this.facing='south-east';
        else if(Math.abs(x)<.001&&y>0)this.facing='south';
        else if(x<0&&y>0)this.facing='south-west';
        else if(x<0&&Math.abs(y)<.001)this.facing='west';
        else this.facing='north-west';
        const mode=sprinting?'run':'walk', count=sprinting?4:6, duration=sprinting?80:112;
        if(this.animationMode!==mode){this.animationMode=mode;this.frameIndex=0;this.lastFrame=t;}
        else if(t-this.lastFrame>=duration){this.frameIndex=(this.frameIndex+1)%count;this.lastFrame=t;}
        const tex=sprinting?`player_${this.facing}_run_${this.frameIndex}`:`player_${this.facing}_${this.frameIndex}`;
        if(this.player.texture.key!==tex)this.player.setTexture(tex);
      }else{
        this.animationMode=null;this.frameIndex=0;
        const tex=`player_${this.facing}_idle`;if(this.player.texture.key!==tex)this.player.setTexture(tex);
      }

      this.player.setDepth(this.player.y+120);
      this.playerName.setPosition(this.player.x,this.player.y+12);
      this.nearId=null;this.nearSign=false;
      let best=90;
      for(const n of this.actors){
        const dx=this.player.x-n.actor.x,dy=this.player.y-n.actor.y;
        let dir=Math.abs(dx)>Math.abs(dy)?(dx>0?'south-east':'north-west'):(dy>0?'south-west':'north-east');
        let tex=n.kind==='kim'?`kim_${dir}`:`teacher_${n.teacher}_${dir}`,flip=false;
        if(n.kind!=='kim'&&n.teacher===1&&dir==='north-west'){tex='teacher_1_north-east';flip=true;}
        n.actor.setFlipX(flip);if(n.actor.texture.key!==tex)n.actor.setTexture(tex);
        n.actor.setDepth(n.actor.y+110);
        const dist=Phaser.Math.Distance.Between(this.player.x,this.player.y,n.actor.x,n.actor.y);
        if(n.enabled&&dist<best){best=dist;this.nearId=n.id;}
      }
      const signDist=this.signPoint?Phaser.Math.Distance.Between(this.player.x,this.player.y,this.signPoint.x,this.signPoint.y):Infinity;
      this.nearSign=!this.nearId&&signDist<120;
      const can=!!this.nearId||this.nearSign;
      this.prompt.setVisible(can);
      if(can){this.prompt.setText(this.nearSign?'E  BEKIJK':'E  PRAAT');this.prompt.setPosition(this.player.x,this.player.y-72);}
    }
  };
}

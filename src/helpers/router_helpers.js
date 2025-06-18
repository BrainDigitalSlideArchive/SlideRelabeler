export function add_to_file_route_hash(file_route, append_contents){
  let new_file_route = file_route
  new_file_route[1].hash += append_contents;
  return new_file_route;
}